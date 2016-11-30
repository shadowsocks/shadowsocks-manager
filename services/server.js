'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('system');

const knex = appRequire('init/knex').knex;
const crypto = require('crypto');
const path = require('path');
const config = appRequire('services/config').all();
const password = config.manager.password;
let host;
let port;
let socketPath;
if(config.manager.address.indexOf(':') < 0) {
  socketPath = config.manager.address;
  if(process.platform === 'win32') {
    socketPath = path.join('\\\\?\\pipe', process.cwd(), config.manager.address);
  }
} else {
  host = config.manager.address.split(':')[0];
  port = +config.manager.address.split(':')[1];
}
const shadowsocks = appRequire('services/shadowsocks');

const net = require('net');

const receiveData = (receive, data) => {
  receive.data = Buffer.concat([receive.data, data]);
  checkData(receive);
};

const checkCode = (data, password, code) => {
  const time = Number.parseInt(data.slice(0, 6).toString('hex'), 16);
  if(Math.abs(Date.now() - time) > 10 * 60 * 1000) {
    return false;
  }
  const command = data.slice(6).toString();
  const md5 = crypto.createHash('md5').update(time + command + password).digest('hex');
  return md5.substr(0, 8) === code.toString('hex');
};

const receiveCommand = async (data, code) => {
  try {
    const time = Number.parseInt(data.slice(0, 6).toString('hex'), 16);
    await knex('command').whereBetween('time', [0, Date.now() - 10 * 60 * 1000]).del();
    await knex('command').insert({
      code: code.toString('hex'),
      time,
    });
    const message = JSON.parse(data.slice(6).toString());
    logger.info(message);
    if(message.command === 'add') {
      const port = +message.port;
      const password = message.password;
      return shadowsocks.addAccount(port, password);
    } else if (message.command === 'del') {
      const port = +message.port;
      return shadowsocks.removeAccount(port);
    } else if (message.command === 'list') {
      // const options = message.options || {
      //   flow: true,
      //   startTime: new Date(Date.now() - 5 * 60 * 1000),
      //   endTime: Date.now(),
      // };
      return shadowsocks.listAccount();
    } else if (message.command === 'pwd') {
      const port = +message.port;
      const password = message.password;
      return shadowsocks.changePassword(port, password);
    } else if (message.command === 'flow') {
      const options = message.options;
      return shadowsocks.getFlow(options);
    } else {
      return Promise.reject();
    }
  } catch(err) {
    throw err;
  }
};

const checkData = (receive) => {
  const buffer = receive.data;
  let length = 0;
  let data;
  let code;
  if (buffer.length < 2) {
    return;
  }
  length = buffer[0] * 256 + buffer[1];
  if (buffer.length >= length + 2) {
    data = buffer.slice(2, length - 2);
    code = buffer.slice(length - 2);
    // receive.data = buffer.slice(length + 2, buffer.length);
    if(!checkCode(data, password, code)) {
      receive.socket.end();
      // receive.socket.close();
      return;
    }
    receiveCommand(data, code).then(s => {
      receive.socket.end(JSON.stringify({code: 0, data: s}));
      // receive.socket.close();
    }, e => {
      receive.socket.end(JSON.stringify({code: 1}));
      // receive.socket.close();
    });
    if(buffer.length > length + 2) {
      checkData(receive);
    }
  }
};

const server = net.createServer(socket => {
  const receive = {
    data: new Buffer(0),
    socket: socket,
  };
  socket.on('data', data => {
    receiveData(receive, data);
  });
  socket.on('end', () => {
    // console.log('end');
  });
  socket.on('close', () => {
    // console.log('close');
  });
}).on('error', (err) => {
  console.log(`socket error:\n${err.stack}`);
});

server.listen(socketPath || {
  port,
  host,
}, () => {
  logger.info(`server listen on ${ host }:${ port }`);
});
