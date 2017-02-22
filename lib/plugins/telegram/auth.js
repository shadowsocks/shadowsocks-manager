'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const telegram = appRequire('plugins/telegram/index').telegram;
const knex = appRequire('init/knex').knex;

const log4js = require('log4js');
const logger = log4js.getLogger('telegram');

const setManager = (() => {
  var _ref = _asyncToGenerator(function* (message) {
    try {
      const manager = yield knex('telegram').select(['value']).where({
        key: 'manager'
      });
      if (manager.length === 0) {
        yield knex('telegram').insert({
          key: 'manager',
          value: message.message.from.id
        });
        telegram.emit('send', message, 'Authorize success.');
      } else if (+manager[0].value === message.message.from.id) {
        telegram.emit('send', message, 'This user is already a manager.');
      } else {
        telegram.emit('send', message, 'Authorize fail.');
      }
      return;
    } catch (err) {
      logger.error(err);
      return Promise.reject(err);
    }
  });

  return function setManager(_x) {
    return _ref.apply(this, arguments);
  };
})();

const isManager = (() => {
  var _ref2 = _asyncToGenerator(function* (message) {
    try {
      const manager = yield knex('telegram').select(['value']).where({
        key: 'manager'
      });
      if (manager.length === 0) {
        telegram.emit('send', message, 'Send \'auth\' to become manager.');
      } else if (manager.length > 0 && manager[0].value === message.message.from.id + '') {
        telegram.emit('manager', message);
      }
    } catch (err) {
      logger.error(err);
      return Promise.reject(err);
    }
  });

  return function isManager(_x2) {
    return _ref2.apply(this, arguments);
  };
})();

telegram.on('message', message => {
  if (message.message.text === 'auth') {
    setManager(message);
  } else {
    isManager(message);
  }
});