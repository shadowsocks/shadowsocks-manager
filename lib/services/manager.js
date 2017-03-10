'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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

const receiveData = (() => {
  var _ref = _asyncToGenerator(function* (receive, data) {
    receive.data = Buffer.concat([receive.data, data]);
    return checkData(receive);
  });

  return function receiveData(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

const checkData = (() => {
  var _ref2 = _asyncToGenerator(function* (receive) {
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
    }
  });

  return function checkData(_x3) {
    return _ref2.apply(this, arguments);
  };
})();

const sendMessage = (data, options) => {
  const promise = new Promise((resolve, reject) => {
    const client = net.connect(options || {
      host,
      port
    }, () => {
      client.write(pack(data, (options ? options.password : null) || password));
    });
    const receive = {
      data: Buffer.from(''),
      socket: client
    };
    client.on('data', data => {
      receiveData(receive, data).then(message => {
        if (!message) {
          reject(new Error('empty message from ssmgr[s]'));
        } else if (message.code === 0) {
          resolve(message.data);
        } else {
          logger.error(message);
          reject(new Error('ssmgr[s] return an error code'));
        }
        client.end();
      }).catch(err => {
        logger.error(err);
        client.end();
      });
      // const message = JSON.parse(data.toString());
      // // logger.info(message);
      // if(message.code === 0) {
      //   resolve(message.data);
      // } else {
      //   reject('failure');
      // }
      // client.end();
    });
    client.on('close', () => {
      // logger.error('socket close');
      // reject('failure');
      reject(new Error(`ssmgr[s] connection close`));
    });
    client.on('error', err => {
      logger.error(err);
      reject(new Error(`connect to ssmgr[s] fail`));
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