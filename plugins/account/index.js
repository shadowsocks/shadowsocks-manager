const knex = appRequire('init/knex').knex;
const serverManager = appRequire('plugins/flowSaver/server');
const manager = appRequire('services/manager');
const checkAccount = appRequire('plugins/account/checkAccount');
const config = appRequire('services/config').all();
const macAccount = appRequire('plugins/macAccount/index');

const addAccount = async (type, options) => {
  await checkAccount.deleteCheckAccountTimePort(options.port);
  if(type === 6 || type === 7) {
    type = 3;
  }
  if(type === 1) {
    await knex('account_plugin').insert({
      type,
      userId: options.user,
      port: options.port,
      password: options.password,
      status: 0,
      server: options.server ? options.server : null,
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
      server: options.server ? options.server : null,
      autoRemove: options.autoRemove || 0,
      multiServerFlow: options.multiServerFlow || 0,
    });
    await checkAccount.checkServer();
    return;
  }
};

const changePort = async (id, port) => {
  const result = await knex('account_plugin').update({ port }).where({ id });
  await checkAccount.checkServer();
};

const getAccount = async (options = {}) => {
  const where = {};
  if(options.id) {
    where['account_plugin.id'] = options.id;
  }
  if(options.userId) {
    where['user.id'] = options.userId;
  }
  if(options.port) {
    where['account_plugin.port'] = options.port;
  }
  if(options.group >= 0) {
    where['user.group'] = options.group;
  }
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
    'account_plugin.multiServerFlow',
    'user.id as userId',
    'user.email as user',
  ])
  .leftJoin('user', 'user.id', 'account_plugin.userId')
  .where(where);
  return account;
};

const delAccount = async id => {
  const result = await knex('account_plugin').delete().where({ id });
  if(!result) {
    return Promise.reject('Account id[' + id + '] not found');
  }
  await checkAccount.checkServer();
  return result;
};

const editAccount = async (id, options) => {
  if(options.port) {
    await checkAccount.deleteCheckAccountTimePort(options.port);
  }
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
  update.multiServerFlow = options.multiServerFlow;
  if(options.hasOwnProperty('server')) {
    update.server = options.server ? JSON.stringify(options.server) : null;
  }
  if(options.type === 1) {
    update.data = null;
    // update.port = +options.port;
  } else if(options.type >= 2 && options.type <= 5) {
    update.data = JSON.stringify({
      create: options.time || Date.now(),
      flow: options.flow || 1 * 1000 * 1000 * 1000,
      limit: options.limit || 1,
    });
    // update.port = +options.port;
  }
  if(options.port) {
    update.port = +options.port;
  }
  await knex('account_plugin').update(update).where({ id });
  await checkAccount.checkServer();
  return;
};

const editAccountTime = async (id, timeString, check) => {
  const time = +timeString;
  let accountInfo = await knex('account_plugin').where({ id }).then(s => s[0]);
  accountInfo.data = JSON.parse(accountInfo.data);
  if(accountInfo.type < 2 || accountInfo.type > 5) { return; }
  const timePeriod = {
    '2': 7 * 86400 * 1000,
    '3': 30 * 86400 * 1000,
    '4': 1 * 86400 * 1000,
    '5': 3600 * 1000,
  };
  accountInfo.data.create += time;
  while(time > 0 && accountInfo.data.create >= Date.now()) {
    accountInfo.data.limit += 1;
    accountInfo.data.create -= timePeriod[accountInfo.type];
  }
  await knex('account_plugin').update({
    data: JSON.stringify(accountInfo.data)
  }).where({ id });
  if(check) {
    await checkAccount.deleteCheckAccountTimePort(accountInfo.port);
  }
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

const setAccountLimit = async (userId, accountId, orderType) => {
  const payType = {
    week: 2, month: 3, day: 4, hour: 5, season: 6, year: 7,
  };
  let paymentType;
  let limit = 1;
  if(orderType === 6) { limit = 3; }
  if(orderType === 7) { limit = 12; }
  const flow = {};
  const paymentInfo = await knex('webguiSetting').select().where({
    key: 'payment',
  }).then(success => {
    if(!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value;
  });
  for (const p in payType) {
    if(payType[p] === orderType) {
      paymentType = p;
    }
    // if(paymentInfo[p].alipay) {
    flow[payType[p]] = paymentInfo[p].flow * 1000 * 1000;
    // }
  };
  let account;
  if(accountId) {
    account = await knex('account_plugin').select().where({ id: accountId }).then(success => {
      if(success.length) {
        return success[0];
      }
      return null;
    });
  }
  if(!accountId || !account) {
    const getNewPort = () => {
      return knex('webguiSetting').select().where({
        key: 'account',
      }).then(success => {
        if(!success.length) { return Promise.reject('settings not found'); }
        success[0].value = JSON.parse(success[0].value);
        return success[0].value.port;
      }).then(port => {
        if(port.random) {
          const getRandomPort = () => Math.floor(Math.random() * (port.end - port.start + 1) + port.start);
          let retry = 0;
          let myPort = getRandomPort();
          const checkIfPortExists = port => {
            let myPort = port;
            return knex('account_plugin').select()
            .where({ port }).then(success => {
              if(success.length && retry <= 30) {
                retry++;
                myPort = getRandomPort();
                return checkIfPortExists(myPort);
              } else if (success.length && retry > 30) {
                return Promise.reject('Can not get a random port');
              } else {
                return myPort;
              }
            });
          };
          return checkIfPortExists(myPort);
        } else {
          return knex('account_plugin').select()
          .whereBetween('port', [port.start, port.end])
          .orderBy('port', 'DESC').limit(1).then(success => {
            if(success.length) {
              return success[0].port + 1;
            }
            return port.start;
          });
        }
      });
    };
    const port = await getNewPort();
    await addAccount(orderType, {
      user: userId,
      port,
      password: Math.random().toString().substr(2,10),
      time: Date.now(),
      limit,
      flow: flow[orderType],
      server: paymentInfo[paymentType].server ? JSON.stringify(paymentInfo[paymentType].server) : null,
      autoRemove: paymentInfo[paymentType].autoRemove ? 1 : 0,
      multiServerFlow: paymentInfo[paymentType].multiServerFlow ? 1 : 0,
    });
    return;
  }
  const accountData = JSON.parse(account.data);
  accountData.flow = flow[orderType];
  const timePeriod = {
    '2': 7 * 86400 * 1000,
    '3': 30 * 86400 * 1000,
    '4': 1 * 86400 * 1000,
    '5': 3600 * 1000,
    '6': 3 * 30 * 86400 * 1000,
    '7': 12 * 30 * 86400 * 1000,
  };
  let expireTime = accountData.create + accountData.limit * timePeriod[account.type];
  if(expireTime <= Date.now()) {
    expireTime = timePeriod[orderType] + Date.now();
  } else {
    expireTime += timePeriod[orderType];
  }
  let countTime = timePeriod[orderType];
  if(orderType === 6) { countTime = timePeriod[3]; }
  if(orderType === 7) { countTime = timePeriod[3]; }
  accountData.create = expireTime - countTime;
  accountData.limit = 1;
  while(accountData.create >= Date.now()) {
    accountData.limit += 1;
    accountData.create -= countTime;
  }
  let port = await getAccount({ id: accountId }).then(success => success[0].port);
  await knex('account_plugin').update({
    type: orderType >= 6 ? 3 : orderType,
    data: JSON.stringify(accountData),
    server: paymentInfo[paymentType].server ? JSON.stringify(paymentInfo[paymentType].server) : null,
    autoRemove: paymentInfo[paymentType].autoRemove ? 1 : 0,
    multiServerFlow: paymentInfo[paymentType].multiServerFlow ? 1 : 0,
  }).where({ id: accountId });
  await checkAccount.deleteCheckAccountTimePort(port);
  return;
};

const banAccount = async options => {
  const serverId = options.serverId;
  const accountId = options.accountId;
  const time = options.time;
  await knex('account_flow').update({
    status: 'ban',
    nextCheckTime: Date.now() + time,
  }).where({
    serverId, accountId,
  });
};

const getBanAccount = async options => {
  const serverId = options.serverId;
  const accountId = options.accountId;
  const accountInfo = await knex('account_flow').select([
    'nextCheckTime as banTime'
  ]).where({
    serverId, accountId, status: 'ban'
  });
  if(!accountInfo.length) { return { banTime: 0 }; }
  return accountInfo[0];
};

exports.addAccount = addAccount;
exports.getAccount = getAccount;
exports.delAccount = delAccount;
exports.editAccount = editAccount;
exports.editAccountTime = editAccountTime;

exports.changePassword = changePassword;
exports.changePort = changePort;

exports.addAccountLimit = addAccountLimit;
exports.addAccountLimitToMonth = addAccountLimitToMonth;
exports.setAccountLimit = setAccountLimit;

exports.banAccount = banAccount;
exports.getBanAccount = getBanAccount;
