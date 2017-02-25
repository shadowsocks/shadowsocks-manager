'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const knex = appRequire('init/knex').knex;
const serverManager = appRequire('plugins/flowSaver/server');
const manager = appRequire('services/manager');
const checkAccount = appRequire('plugins/account/checkAccount');
const config = appRequire('services/config').all();

const addAccount = (() => {
  var _ref = _asyncToGenerator(function* (type, options) {
    if (type === 1) {
      yield knex('account_plugin').insert({
        type,
        userId: options.user,
        port: options.port,
        password: options.password,
        status: 0,
        autoRemove: 0
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
        status: 0,
        autoRemove: options.autoRemove || 0
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
  var _ref3 = _asyncToGenerator(function* (options = {}) {
    const where = {};
    if (options.id) {
      where['account_plugin.id'] = options.id;
    }
    if (options.userId) {
      where['user.id'] = options.userId;
    }
    if (options.port) {
      where['account_plugin.port'] = options.port;
    }
    const account = yield knex('account_plugin').select(['account_plugin.id', 'account_plugin.type', 'account_plugin.userId', 'account_plugin.server', 'account_plugin.port', 'account_plugin.password', 'account_plugin.data', 'account_plugin.status', 'account_plugin.autoRemove', 'user.id as userId', 'user.email as user']).leftJoin('user', 'user.id', 'account_plugin.userId').where(where);
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
    update.userId = options.userId;
    update.autoRemove = options.autoRemove;
    if (options.type === 1) {
      update.data = null;
      update.port = +options.port;
    } else if (options.type >= 2 && options.type <= 5) {
      update.data = JSON.stringify({
        create: options.time || Date.now(),
        flow: options.flow || 1 * 1000 * 1000 * 1000,
        limit: options.limit || 1
      });
      update.port = +options.port;
    }
    yield knex('account_plugin').update(update).where({ id });
    return;
  });

  return function editAccount(_x6, _x7) {
    return _ref5.apply(this, arguments);
  };
})();

const changePassword = (() => {
  var _ref6 = _asyncToGenerator(function* (id, password) {
    const account = yield knex('account_plugin').select().where({ id }).then(function (success) {
      if (success.length) {
        return success[0];
      }
      return Promise.reject('account not found');
    });
    yield knex('account_plugin').update({
      password
    }).where({ id });
    yield checkAccount.changePassword(id, password);
    return;
  });

  return function changePassword(_x8, _x9) {
    return _ref6.apply(this, arguments);
  };
})();

const addAccountLimit = (() => {
  var _ref7 = _asyncToGenerator(function* (id, number = 1) {
    const account = yield knex('account_plugin').select().where({ id }).then(function (success) {
      if (success.length) {
        return success[0];
      }
      return Promise.reject('account not found');
    });
    if (account.type < 2 || account.type > 5) {
      return;
    }
    const accountData = JSON.parse(account.data);
    const timePeriod = {
      '2': 7 * 86400 * 1000,
      '3': 30 * 86400 * 1000,
      '4': 1 * 86400 * 1000,
      '5': 3600 * 1000
    };
    if (accountData.create + accountData.limit * timePeriod[account.type] <= Date.now()) {
      accountData.create = Date.now();
      accountData.limit = number;
    } else {
      accountData.limit += number;
    }
    yield knex('account_plugin').update({
      data: JSON.stringify(accountData)
    }).where({ id });
    return;
  });

  return function addAccountLimit(_x10) {
    return _ref7.apply(this, arguments);
  };
})();

const addAccountLimitToMonth = (() => {
  var _ref8 = _asyncToGenerator(function* (userId, accountId, number = 1) {
    if (!accountId) {
      const port = yield knex('account_plugin').select().orderBy('port', 'DESC').limit(1).then(function (success) {
        if (success.length) {
          return success[0].port + 1;
        } else {
          return 50000;
        }
      });
      yield addAccount(3, {
        user: userId,
        port,
        password: Math.random().toString().substr(2, 10),
        time: Date.now(),
        limit: number,
        flow: 200 * 1000 * 1000 * 1000,
        autoRemove: 0
      });
      return;
    }
    const account = yield knex('account_plugin').select().where({ id: accountId }).then(function (success) {
      if (success.length) {
        return success[0];
      }
      return Promise.reject('account not found');
    });
    if (account.type < 2 || account.type > 5) {
      return;
    }
    const accountData = JSON.parse(account.data);
    accountData.flow = 200 * 1000 * 1000 * 1000;
    if (account.type === 3) {
      if (accountData.create + accountData.limit * 30 * 86400 * 1000 <= Date.now()) {
        accountData.create = Date.now();
        accountData.limit = number;
      } else {
        accountData.limit += number;
      }
    } else {
      const timePeriod = {
        '2': 7 * 86400 * 1000,
        '3': 30 * 86400 * 1000,
        '4': 1 * 86400 * 1000,
        '5': 3600 * 1000
      };
      let expireTime = accountData.create + accountData.limit * timePeriod[account.type];
      if (expireTime <= Date.now()) {
        expireTime = 30 * 86400 * 1000 * number + Date.now();
      } else {
        expireTime += 30 * 86400 * 1000 * number;
      }
      accountData.create = expireTime;
      accountData.limit = 0;
      while (accountData.create >= Date.now()) {
        accountData.limit += 1;
        accountData.create -= 30 * 86400 * 1000;
      }
    }
    yield knex('account_plugin').update({
      type: 3,
      data: JSON.stringify(accountData),
      autoRemove: 0
    }).where({ id: accountId });
    return;
  });

  return function addAccountLimitToMonth(_x11, _x12) {
    return _ref8.apply(this, arguments);
  };
})();

const setAccountLimit = (() => {
  var _ref9 = _asyncToGenerator(function* (userId, accountId, orderType) {
    // const flow = {
    //   '2': 50 * 1000 * 1000 * 1000,
    //   '3': 200 * 1000 * 1000 * 1000,
    //   '4': 7 * 1000 * 1000 * 1000,
    //   '5': 500 * 1000 * 1000,
    // };
    const payType = {
      week: 2, month: 3, day: 4, hour: 5
    };
    // const flow = config.plugins.account.pay
    const flow = {};
    for (const p in payType) {
      flow[payType[p]] = config.plugins.account.pay[p].flow;
    };
    if (!accountId) {
      const port = yield knex('account_plugin').select().orderBy('port', 'DESC').limit(1).then(function (success) {
        if (success.length) {
          return success[0].port + 1;
        } else {
          return 50000;
        }
      });
      yield addAccount(orderType, {
        user: userId,
        port,
        password: Math.random().toString().substr(2, 10),
        time: Date.now(),
        limit: 1,
        flow: flow[orderType],
        autoRemove: 0
      });
      return;
    }
    const account = yield knex('account_plugin').select().where({ id: accountId }).then(function (success) {
      if (success.length) {
        return success[0];
      }
      return Promise.reject('account not found');
    });
    const accountData = JSON.parse(account.data);
    accountData.flow = flow[orderType];
    const timePeriod = {
      '2': 7 * 86400 * 1000,
      '3': 30 * 86400 * 1000,
      '4': 1 * 86400 * 1000,
      '5': 3600 * 1000
    };
    let expireTime = accountData.create + accountData.limit * timePeriod[account.type];
    if (expireTime <= Date.now()) {
      expireTime = timePeriod[orderType] + Date.now();
    } else {
      expireTime += timePeriod[orderType];
    }
    accountData.create = expireTime - timePeriod[orderType];
    accountData.limit = 1;
    while (accountData.create >= Date.now()) {
      accountData.limit += 1;
      accountData.create -= timePeriod[orderType];
    }
    yield knex('account_plugin').update({
      type: orderType,
      data: JSON.stringify(accountData),
      autoRemove: 0
    }).where({ id: accountId });
    return;
  });

  return function setAccountLimit(_x13, _x14, _x15) {
    return _ref9.apply(this, arguments);
  };
})();

exports.addAccount = addAccount;
exports.getAccount = getAccount;
exports.delAccount = delAccount;
exports.editAccount = editAccount;

exports.changePassword = changePassword;
exports.changePort = changePort;

exports.addAccountLimit = addAccountLimit;
exports.addAccountLimitToMonth = addAccountLimitToMonth;
exports.setAccountLimit = setAccountLimit;