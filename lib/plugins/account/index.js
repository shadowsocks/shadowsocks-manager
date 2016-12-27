'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const knex = appRequire('init/knex').knex;
const serverManager = appRequire('plugins/flowSaver/server');
const manager = appRequire('services/manager');
const checkAccount = appRequire('plugins/account/checkAccount');

const addAccount = (() => {
  var _ref = _asyncToGenerator(function* (type, options) {
    if (type === 1) {
      yield knex('account_plugin').insert({
        type,
        userId: options.user,
        port: options.port,
        password: options.password,
        status: 0
      });
      yield checkAccount.checkServer();
      return;
    } else if (type === 2) {
      yield knex('account_plugin').insert({
        type,
        userId: options.user,
        port: options.port,
        password: options.password,
        data: JSON.stringify({
          create: Date.now(),
          flow: options.flow || 1 * 1000 * 1000 * 1000,
          limit: options.limit || 1
        }),
        status: 0
      });
    }
  });

  return function addAccount(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

const getAccount = (() => {
  var _ref2 = _asyncToGenerator(function* () {
    const account = yield knex('account_plugin').select();
    return account;
  });

  return function getAccount() {
    return _ref2.apply(this, arguments);
  };
})();

exports.addAccount = addAccount;
exports.getAccount = getAccount;