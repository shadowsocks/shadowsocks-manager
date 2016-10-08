const net = require('net');
const path = require('path');
const crypto = require('crypto');
const config = appRequire('services/config').all();
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
let password = config.manager.password;

const pack = (data, password) => {
  const message = JSON.stringify(data);
  const dataBuffer = new Buffer(message);
  const length = dataBuffer.length + 2;
  const lengthBuffer = new Buffer(('0000' + length.toString(16)).substr(-4), 'hex');
  const code = crypto.createHash('md5').update(message + password).digest('hex').substr(0, 4);
  const codeBuffer = new Buffer(code, 'hex');
  const pack = Buffer.concat([lengthBuffer, dataBuffer, codeBuffer]);
  return pack;
};

const sendMessage = (data, options) => {
  return new Promise((res, rej) => {
    const client = net.connect(options || socketPath || {
      host,
      port,
    }, () => {
      client.write(pack(data, (options? options.password: null) || password));
    });
    client.on('data', data => {
      const message = JSON.parse(data.toString());
      if(message.code === 0) {
        res(message.data);
      } else {
        rej('failure');
      }
      client.end();
    });
  });
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
