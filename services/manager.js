'use strict';

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

const sendMessage = (data, options) => {
  const promise = new Promise((res, rej) => {
    const client = net.connect(options || {
      host,
      port,
    }, () => {
      client.write(pack(data, (options? options.password: null) || password));
    });
    client.on('data', data => {
      const message = JSON.parse(data.toString());
      // logger.info(message);
      if(message.code === 0) {
        res(message.data);
      } else {
        rej('failure');
      }
      client.end();
    });
    client.on('close', () => {
      // logger.error('socket close');
      rej('failure');
    });
    client.on('error', err => {
      logger.error(err);
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
