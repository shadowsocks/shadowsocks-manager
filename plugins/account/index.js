'use strict';

const knex = appRequire('init/knex').knex;
const serverManager = appRequire('plugins/flowSaver/server');
const manager = appRequire('services/manager');
const checkAccount = appRequire('plugins/account/checkAccount');

const addAccount = async (type, options) => {
  if(type === 1) {
    await knex('account_plugin').insert({
      type,
      userId: options.user,
      port: options.port,
      password: options.password,
      status: 0,
      autoRemove: 0,
    });
    await checkAccount.checkServer();
    return;
  } else if (type >= 2 && type <= 5) {
    await knex('account_plugin').insert({
      type,
      userId: options.user,
      port: options.port,
      password: options.password,
      data: JSON.stringify({
        create: options.time || Date.now(),
        flow: options.flow || 1 * 1000 * 1000 * 1000,
        limit: options.limit || 1,
      }),
      status: 0,
      autoRemove: options.autoRemove || 0,
    });
    await checkAccount.checkServer();
    return;
  }
};

const changePort = async (id, port) => {
  const result = await knex('account_plugin').update({ port }).where({ id });
  await checkAccount.checkServer();
};

const getAccount = async (where) => {
  const account = await knex('account_plugin').select([
    'account_plugin.id',
    'account_plugin.type',
    'account_plugin.userId',
    'account_plugin.server',
    'account_plugin.port',
    'account_plugin.password',
    'account_plugin.data',
    'account_plugin.status',
    'account_plugin.autoRemove',
    'user.id as userId',
    'user.email as user',
  ])
  .leftJoin('user', 'user.id', 'account_plugin.userId')
  .where(where || {});
  return account;
};

const delAccount = async (id) => {
  const result = await knex('account_plugin').delete().where({ id });
  if(!result) {
    return Promise.reject('Account id[' + id + '] not found');
  }
  await checkAccount.checkServer();
  return result;
};

const editAccount = async (id, options) => {
  const account = await knex('account_plugin').select().where({ id }).then(success => {
    if(success.length) {
      return success[0];
    }
    return Promise.reject('account not found');
  });
  const update = {};
  update.type = options.type;
  update.userId = options.userId;
  update.autoRemove = options.autoRemove;
  if(options.type === 1) {
    update.data = null;
    update.port = +options.port;
  } else if(options.type >= 2 && options.type <= 5) {
    update.data = JSON.stringify({
      create: options.time || Date.now(),
      flow: options.flow || 1 * 1000 * 1000 * 1000,
      limit: options.limit || 1,
    });
    update.port = +options.port;
  }
  await knex('account_plugin').update(update).where({ id });
  return;
};

const changePassword = async (id, password) => {
  const account = await knex('account_plugin').select().where({ id }).then(success => {
    if(success.length) {
      return success[0];
    }
    return Promise.reject('account not found');
  });
  await knex('account_plugin').update({
    password,
  }).where({ id });
  await checkAccount.changePassword(id, password);
  return;
};

const addAccountLimit = async (id, number = 1) => {
  const account = await knex('account_plugin').select().where({ id }).then(success => {
    if(success.length) {
      return success[0];
    }
    return Promise.reject('account not found');
  });
  if(account.type < 2 || account.type > 5) { return; }
  const accountData = JSON.parse(account.data);
  const timePeriod = {
    '2': 7 * 86400 * 1000,
    '3': 30 * 86400 * 1000,
    '4': 1 * 86400 * 1000,
    '5': 3600 * 1000,
  };
  if(accountData.create + accountData.limit * timePeriod[account.type] <= Date.now()) {
    accountData.create = Date.now();
    accountData.limit = number;
  } else {
    accountData.limit += number;
  }
  await knex('account_plugin').update({
    data: JSON.stringify(accountData),
  }).where({ id });
  return;
};

const addAccountLimitToMonth = async (userId, accountId, number = 1) => {
  if(!accountId) {
    const port = await knex('account_plugin').select()
    .orderBy('port', 'DESC').limit(1)
    .then(success => {
      if(success.length) {
        return success[0].port + 1;
      } else {
        return 50000;
      }
    });
    await addAccount(3, {
      user: userId,
      port,
      password: Math.random().toString().substr(2,10),
      time: Date.now(),
      limit: number,
      flow: 200 * 1000 * 1000 * 1000,
      autoRemove: 0,
    });
    return;
  }
  const account = await knex('account_plugin').select().where({ id: accountId }).then(success => {
    if(success.length) {
      return success[0];
    }
    return Promise.reject('account not found');
  });
  if(account.type < 2 || account.type > 5) { return; }
  const accountData = JSON.parse(account.data);
  accountData.flow = 200 * 1000 * 1000 * 1000;
  if(account.type === 3) {
    if(accountData.create + accountData.limit * 30 * 86400 * 1000 <= Date.now()) {
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
      '5': 3600 * 1000,
    };
    let expireTime = accountData.create + accountData.limit * timePeriod[account.type];
    if(expireTime <= Date.now()) {
      expireTime = 30 * 86400 * 1000 * number + Date.now();
    } else {
      expireTime += 30 * 86400 * 1000 * number;
    }
    accountData.create = expireTime;
    accountData.limit = 0;
    while(accountData.create >= Date.now()) {
      accountData.limit += 1;
      accountData.create -= 30 * 86400 * 1000;
    }
  }
  await knex('account_plugin').update({
    type: 3,
    data: JSON.stringify(accountData),
    autoRemove: 0,
  }).where({ id: accountId });
  return;
};

exports.addAccount = addAccount;
exports.getAccount = getAccount;
exports.delAccount = delAccount;
exports.editAccount = editAccount;

exports.changePassword = changePassword;
exports.changePort = changePort;

exports.addAccountLimit = addAccountLimit;
exports.addAccountLimitToMonth = addAccountLimitToMonth;
