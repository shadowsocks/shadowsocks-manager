'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const log4js = require('log4js');
const logger = log4js.getLogger('freeAccount');

const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const flow = appRequire('plugins/flowSaver/flow');
const crypto = require('crypto');
const config = appRequire('services/config').all();
const email = appRequire('plugins/email/index');
const moment = require('moment');

const getRandomPort = (() => {
  var _ref = _asyncToGenerator(function* (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    let port;
    let isPortExist = true;
    let number = 0;
    while (isPortExist && number < 20) {
      port = Math.floor(Math.random() * (max - min + 1)) + min;
      logger.info(`Get random port: ${port}`);
      isPortExist = (yield knex('freeAccount').select().where({ port }))[0];
      number++;
    }
    return isPortExist ? Promise.reject('Get Random Port Fail') : port;
  });

  return function getRandomPort(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

const limit = (() => {
  var _ref2 = _asyncToGenerator(function* (emailAddress) {
    const limit = config.plugins.freeAccount.limit;
    const time = {
      day: moment().hour(0).minute(0).second(0).millisecond(0).toDate(),
      week: moment().day(0).hour(0).minute(0).second(0).millisecond(0).toDate(),
      month: moment().date(1).hour(0).minute(0).second(0).millisecond(0).toDate()
    };
    if (limit.user.day) {
      const count = (yield knex('freeAccount').count().where({
        isDisabled: true,
        email: emailAddress
      }).whereBetween('time', [time.day, Date.now()]))[0]['count(*)'];
      logger.info(`[${emailAddress}] Check limit, user.day, ${limit.user.day}, ${count}`);
      if (count >= limit.user.day) {
        return Promise.reject('out of limit, user.day, ' + count);
      }
    }
    if (limit.user.week) {
      const count = (yield knex('freeAccount').count().where({
        isDisabled: true,
        email: emailAddress
      }).whereBetween('time', [time.week, Date.now()]))[0]['count(*)'];
      logger.info(`[${emailAddress}] Check limit, user.week, ${limit.user.week}, ${count}`);
      if (count >= limit.user.week) {
        return Promise.reject('out of limit, user.week, ' + count);
      }
    }
    if (limit.user.month) {
      const count = (yield knex('freeAccount').count().where({
        isDisabled: true,
        email: emailAddress
      }).whereBetween('time', [time.month, Date.now()]))[0]['count(*)'];
      logger.info(`[${emailAddress}] Check limit, user.month, ${limit.user.month}, ${count}`);
      if (count >= limit.user.month) {
        return Promise.reject('out of limit, user.month, ' + count);
      }
    }
    if (limit.global.day) {
      const count = (yield knex('freeAccount').count().where({
        isDisabled: true
      }).whereBetween('time', [time.day, Date.now()]))[0]['count(*)'];
      logger.info(`[${emailAddress}] Check limit, global.day, ${limit.global.day}, ${count}`);
      if (count >= limit.global.day) {
        return Promise.reject('out of limit, global.day, ' + count);
      }
    }
    if (limit.global.week) {
      const count = (yield knex('freeAccount').count().where({
        isDisabled: true
      }).whereBetween('time', [time.week, Date.now()]))[0]['count(*)'];
      logger.info(`[${emailAddress}] Check limit, global.week, ${limit.global.week}, ${count}`);
      if (count >= limit.global.week) {
        return Promise.reject('out of limit, global.week, ' + count);
      }
    }
    if (limit.global.month) {
      const count = (yield knex('freeAccount').count().where({
        isDisabled: true
      }).whereBetween('time', [time.month, Date.now()]))[0]['count(*)'];
      logger.info(`[${emailAddress}] Check limit, global.month, ${limit.global.month}, ${count}`);
      if (count >= limit.global.month) {
        return Promise.reject('out of limit, global.month, ' + count);
      }
    }
    return;
  });

  return function limit(_x3) {
    return _ref2.apply(this, arguments);
  };
})();

const createAccount = (() => {
  var _ref3 = _asyncToGenerator(function* (emailAddress) {
    // check if this email has an account,
    // if true, return old account instead of create one.
    const oldAccount = yield knex('freeAccount').select().where({ email: emailAddress, isDisabled: false });
    if (oldAccount.length > 0) {
      logger.info(`[${emailAddress}] Use old accout: ${oldAccount[0].address}`);
      return oldAccount[0].address;
    }

    // check if free account out of limit
    yield limit(emailAddress);

    // create account
    const min = config.plugins.freeAccount.shadowsocks.startPort;
    const max = config.plugins.freeAccount.shadowsocks.endPort;
    const port = yield getRandomPort(min, max);
    const password = crypto.randomBytes(4).toString('hex');
    try {
      yield manager.send({
        command: 'add',
        port,
        password
      });
      const address = crypto.randomBytes(16).toString('hex');
      yield knex('freeAccount').insert({
        address,
        email: emailAddress,
        port,
        flow: config.plugins.freeAccount.shadowsocks.flow * 1000 * 1000,
        currentFlow: 0,
        time: Date.now(),
        expired: Date.now() + config.plugins.freeAccount.shadowsocks.time * 60 * 1000,
        isDisabled: false
      });
      let text = '';
      text += 'Shadowsocks 账号创建成功，请访问下列地址查看\n';
      text += 'http://' + config.plugins.freeAccount.host;
      text += config.plugins.freeAccount.port === 80 ? '' : ':' + config.plugins.freeAccount.port;
      text += '/' + address;
      yield email.sendMail(emailAddress, 'Free Shadowsocks 账号', text);
      logger.info(`[${emailAddress}] Create accout: ${address}`);
      return address;
    } catch (err) {
      logger.error(err);
      return Promise.reject(err);
    }
  });

  return function createAccount(_x4) {
    return _ref3.apply(this, arguments);
  };
})();

const checkAccount = (() => {
  var _ref4 = _asyncToGenerator(function* () {
    try {
      const list = yield manager.send({
        command: 'list'
      });
      const account = yield knex('freeAccount').select().where({
        isDisabled: false
      });
      list.forEach((() => {
        var _ref5 = _asyncToGenerator(function* (l) {
          const myAccount = account.filter(function (f) {
            return f.port === l.port;
          })[0];
          if (!myAccount) {
            yield manager.send({
              command: 'del',
              port: l.port
            });
            logger.info(`Delete port: ${l.port}`);
          }
        });

        return function (_x5) {
          return _ref5.apply(this, arguments);
        };
      })());
      account.forEach((() => {
        var _ref6 = _asyncToGenerator(function* (f) {
          const myFlow = (yield flow.getFlow(f.time, f.expired)).filter(function (fil) {
            return fil.port === f.port;
          })[0];
          if (myFlow) {
            yield knex('freeAccount').where({
              address: f.address
            }).update({
              currentFlow: myFlow.sumFlow
            });
          }
          if (Date.now() >= f.expired || f.currentFlow >= f.flow) {
            yield knex('freeAccount').where({
              address: f.address
            }).update({
              isDisabled: true
            });
            yield manager.send({
              command: 'del',
              port: f.port
            });
            logger.info(`Delete account: ${f.address}`);
          }
        });

        return function (_x6) {
          return _ref6.apply(this, arguments);
        };
      })());
    } catch (err) {
      logger.error(err);
    }
  });

  return function checkAccount() {
    return _ref4.apply(this, arguments);
  };
})();

checkAccount();
setInterval(() => {
  checkAccount();
}, 60 * 1000);

exports.createAccount = createAccount;