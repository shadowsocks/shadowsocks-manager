const log4js = require('log4js');
const logger = log4js.getLogger('system');

const net = require('net');
const path = require('path');
const crypto = require('crypto');
const config = appRequire('services/config').all();
const host = config.manager.address.split(':')[0];
const port = +config.manager.address.split(':')[1];
const password = config.manager.password;

const pack = (data, password) => {
  const message = JSON.stringify(data);
  const now = Date.now();
  const timeBuffer = Buffer.from('0' + now.toString(16), 'hex');
  const dataBuffer = Buffer.from(message);
  const length = dataBuffer.length + 4 + 6;
  const lengthBuffer = Buffer.from(('0000' + length.toString(16)).substr(-4), 'hex');
  const code = crypto.createHash('md5').update(now + message + password).digest('hex').substr(0, 8);
  const codeBuffer = Buffer.from(code, 'hex');
  const pack = Buffer.concat([lengthBuffer, timeBuffer, dataBuffer, codeBuffer]);
  return pack;
};

const receiveData = async (receive, data) => {
  receive.data = Buffer.concat([receive.data, data]);
  return checkData(receive);
};

const checkData = async (receive) => {
  const buffer = receive.data;
  let length = 0;
  let data;
  if (buffer.length < 2) {
    return;
  }
  length = buffer[0] * 256 + buffer[1];
  if (buffer.length >= length + 2) {
    data = buffer.slice(2, length + 2);
    const message = JSON.parse(data.toString());
    return message;
  } else {
    return;
  }
};

const sendMessage = (data, options) => {
  if(options && options.host) {
    options.host = options.host.split(':')[0];
  }
  if(!options) {
    options = { host, port, password };
  }
  const promise = new Promise((resolve, reject) => {
    const client = net.connect(options || {
      host,
      port,
    }, () => {
      client.write(pack(data, (options? options.password: null) || password));
    });
    client.setTimeout(10 * 1000);
    const receive = {
      data: Buffer.from(''),
      socket: client,
    };
    client.on('data', data => {
      receiveData(receive, data).then(message => {
        if(!message) {
          // reject(new Error(`empty message from ssmgr[s] [${ options.host || host }:${ options.port || port }]`));
        } else if(message.code === 0) {
          resolve(message.data);
        } else {
          logger.error(message);
          reject(new Error(`ssmgr[s] return an error code [${ options.host || host }:${ options.port || port }]`));
        }
        client.end();
      }).catch(err => {
        logger.error(err);
        client.end();
      });
    });
    client.on('close', () => {
      reject(new Error(`ssmgr[s] connection close [${ options.host || host }:${ options.port || port }]`));
    });
    client.on('error', err => {
      logger.error(err);
      reject(new Error(`connect to ssmgr[s] fail [${ options.host || host }:${ options.port || port }]`));
    });
    client.on('timeout', () => {
      logger.error('timeout');
      reject(new Error(`connect to ssmgr[s] timeout [${ options.host || host }:${ options.port || port }]`));
      client.end();
    });
  });
  return promise;
};

/*
{
  command: 'add/del/list/pwd/flow',
  port: 1234,
  password: '123456',
  options: {
    startTime: xxx
    endTime: xxx
    clear: true
  },
}, {
  host: '',
  port: '',
  password: '',
}
 */
exports.send = sendMessage;
