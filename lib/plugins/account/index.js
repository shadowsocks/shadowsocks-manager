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
    } else if (type >= 2 && type <= 5) {
      yield knex('account_plugin').insert({
        type,
        userId: options.user,
        port: options.port,
        password: options.password,
        data: JSON.stringify({
          create: options.time || Date.now(),
          flow: options.flow || 1 * 1000 * 1000 * 1000,
          limit: options.limit || 1
        }),
        status: 0
      });
      yield checkAccount.checkServer();
      return;
    }
  });

  return function addAccount(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

const changePort = (() => {
  var _ref2 = _asyncToGenerator(function* (id, port) {
    const result = yield knex('account_plugin').update({ port }).where({ id });
    yield checkAccount.checkServer();
  });

  return function changePort(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
})();

const getAccount = (() => {
  var _ref3 = _asyncToGenerator(function* () {
    const account = yield knex('account_plugin').select();
    return account;
  });

  return function getAccount() {
    return _ref3.apply(this, arguments);
  };
})();

const delAccount = (() => {
  var _ref4 = _asyncToGenerator(function* (id) {
    const result = yield knex('account_plugin').delete().where({ id });
    if (!result) {
      return Promise.reject('Account id[' + id + '] not found');
    }
    yield checkAccount.checkServer();
    return result;
  });

  return function delAccount(_x5) {
    return _ref4.apply(this, arguments);
  };
})();

const editAccount = (() => {
  var _ref5 = _asyncToGenerator(function* (id, options) {
    const account = yield knex('account_plugin').select().where({ id }).then(function (success) {
      if (success.length) {
        return success[0];
      }
      return Promise.reject('account not found');
    });
    const update = {};
    update.type = options.type;
    if (options.type === 1) {
      update.data = null;
      update.port = +options.port;
      // update.password = options.password;
    } else if (options.type >= 2 && options.type <= 5) {
      update.data = JSON.stringify({
        create: options.time || Date.now(),
        flow: options.flow || 1 * 1000 * 1000 * 1000,
        limit: options.limit || 1
      });
      update.port = +options.port;
      // update.password = options.password;
    }
    yield knex('account_plugin').update(update).where({ id });
    return;
  });

  return function editAccount(_x6, _x7) {
    return _ref5.apply(this, arguments);
  };
})();

exports.addAccount = addAccount;
exports.getAccount = getAccount;
exports.delAccount = delAccount;
exports.editAccount = editAccount;

exports.changePort = changePort;