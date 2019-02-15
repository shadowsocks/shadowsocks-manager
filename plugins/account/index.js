const knex = appRequire('init/knex').knex;
const serverManager = appRequire('plugins/flowSaver/server');
const manager = appRequire('services/manager');
const config = appRequire('services/config').all();
const macAccount = appRequire('plugins/macAccount/index');
const orderPlugin = appRequire('plugins/webgui_order');
const accountFlow = appRequire('plugins/account/accountFlow');

const runCommand = async cmd => {
  const exec = require('child_process').exec;
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if(err) {
        return reject(stderr);
      } else {
        return resolve(stdout);
      }
    });
  });
};

const addAccount = async (type, options) => {
  let key;
  try {
    const privateKey = await runCommand('wg genkey');
    const publicKey = await runCommand(`echo '${ privateKey.trim() }' | wg pubkey`);
    key = publicKey.trim() + ':' + privateKey.trim();
  } catch(err) {}
  if(!options.hasOwnProperty('active')) { options.active = 1; }
  if(type === 6 || type === 7) {
    type = 3;
  }
  if(type === 1) {
    const [ accountId ] = await knex('account_plugin').insert({
      type,
      orderId: 0,
      userId: options.user,
      port: options.port,
      password: options.password,
      status: 0,
      server: options.server ? options.server : null,
      autoRemove: 0,
      key,
    });
    await accountFlow.add(accountId);
    return accountId;
  } else if (type >= 2 && type <= 5) {
    const [ accountId ] = await knex('account_plugin').insert({
      type,
      orderId: options.orderId || 0,
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
      autoRemoveDelay: options.autoRemoveDelay || 0,
      multiServerFlow: options.multiServerFlow || 0,
      active: options.active,
      key,
    });
    await accountFlow.add(accountId);
    return accountId;
  }
};

const changePort = async (id, port) => {
  const result = await knex('account_plugin').update({ port }).where({ id });
  await accountFlow.edit(id);
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
    'account_plugin.orderId',
    'account_plugin.userId',
    'account_plugin.server',
    'account_plugin.port',
    'account_plugin.password',
    'account_plugin.key',
    'account_plugin.data',
    'account_plugin.status',
    'account_plugin.autoRemove',
    'account_plugin.autoRemoveDelay',
    'account_plugin.multiServerFlow',
    'account_plugin.active',
    'user.id as userId',
    'user.email as user',
  ])
  .leftJoin('user', 'user.id', 'account_plugin.userId')
  .where(where);
  return account;
};

const getOnlineAccount = async serverId => {
  if(!serverId) {
    const onlines = await knex('saveFlow').select([
      'saveFlow.id as serverId',
    ]).countDistinct('saveFlow.accountId as online')
    .where('saveFlow.time', '>', Date.now() - 5 * 60 * 1000)
    .groupBy('saveFlow.id');
    const result = {};
    for(const online of onlines) {
      result[online.serverId] = online.online;
    };
    return result;
  }
  const account = await knex('account_plugin').select([
    'account_plugin.id',
    'account_plugin.port',
  ])
  .whereExists(
    knex('saveFlow')
    .where({ 'saveFlow.id': serverId })
    .whereRaw('saveFlow.accountId = account_plugin.id')
    .where('saveFlow.time', '>', Date.now() - 5 * 60 * 1000)
  );
  return account.map(m => m.id);
};

const delAccount = async id => {
  const accountInfo = await knex('account_plugin').where({ id }).then(s => s[0]);
  if(!accountInfo) {
    return Promise.reject('Account id[' + id + '] not found');
  }
  const result = await knex('account_plugin').delete().where({ id });
  const servers = await knex('server').where({});
  servers.forEach(server => {
    manager.send({
      command: 'del',
      port: accountInfo.port + server.shift,
    }, {
      host: server.host,
      port: server.port,
      password: server.password,
    });
  });
  await accountFlow.del(id);
  return result;
};

const editAccount = async (id, options) => {
  const account = await knex('account_plugin').where({ id }).then(success => {
    if(success.length) {
      return success[0];
    }
    return Promise.reject('account not found');
  });
  const update = {};
  if(options.hasOwnProperty('active')) { update.active = options.active; }
  update.type = options.type;
  update.orderId = options.orderId;
  update.userId = options.userId;
  update.autoRemove = options.autoRemove;
  update.autoRemoveDelay = options.autoRemoveDelay;
  update.multiServerFlow = options.multiServerFlow;
  if(options.hasOwnProperty('server')) {
    update.server = options.server ? JSON.stringify(options.server) : null;
  }
  if(options.type === 1) {
    update.data = null;
  } else if(options.type >= 2 && options.type <= 5) {
    update.data = JSON.stringify({
      create: options.time || Date.now(),
      flow: options.flow || 1 * 1000 * 1000 * 1000,
      limit: options.limit || 1,
    });
  }
  if(options.port) {
    update.port = +options.port;
    if(+options.port !== account.port) {
      const servers = await knex('server').where({});
      servers.forEach(server => {
        manager.send({
          command: 'del',
          port: account.port + server.shift,
        }, {
          host: server.host,
          port: server.port,
          password: server.password,
        });
      });
    }
  }
  await knex('account_plugin').update(update).where({ id });
  await await accountFlow.edit(id);
  return;
};

const editAccountTime = async (id, timeString, check) => {
  const time = +timeString;
  let accountInfo = await knex('account_plugin').where({ id }).then(s => s[0]);
  if(accountInfo.type < 2 || accountInfo.type > 5) { return; }
  accountInfo.data = JSON.parse(accountInfo.data);
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
  await accountFlow.edit(id);
};

const editAccountTimeForRef = async (id, timeString, check) => {
  const time = +timeString;
  let accountInfo = await knex('account_plugin').where({ id }).then(s => s[0]);
  if(accountInfo.type < 2 || accountInfo.type > 5) { return; }
  accountInfo.data = JSON.parse(accountInfo.data);
  const timePeriod = {
    '2': 7 * 86400 * 1000,
    '3': 30 * 86400 * 1000,
    '4': 1 * 86400 * 1000,
    '5': 3600 * 1000,
  };
  if(accountInfo.data.create + timePeriod[accountInfo.type] * accountInfo.data.limit <= Date.now()) {
    accountInfo.data.limit = 1;
    accountInfo.data.create = Date.now() + time - timePeriod[accountInfo.type];
  } else {
    accountInfo.data.create += time;
  }
  while(time > 0 && accountInfo.data.create >= Date.now()) {
    accountInfo.data.limit += 1;
    accountInfo.data.create -= timePeriod[accountInfo.type];
  }
  await knex('account_plugin').update({
    data: JSON.stringify(accountInfo.data)
  }).where({ id });
  await accountFlow.edit(id);
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
  await accountFlow.pwd(id, password);
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

const setAccountLimit = async (userId, accountId, orderId) => {
  const orderInfo = await orderPlugin.getOneOrder(orderId);
  if(orderInfo.baseId) {
    await knex('webgui_flow_pack').insert({
      accountId,
      flow: orderInfo.flow,
      createTime: Date.now(),
    });
    await accountFlow.edit(accountId);
    return;
  }
  const limit = orderInfo.cycle;
  const orderType = orderInfo.type;
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
      let orderPorts = [];
      if(orderInfo.portRange !== '0') {
        try {
          orderInfo.portRange.split(',').filter(f => f.trim()).forEach(f => {
            if(f.indexOf('-')) {
              const start = f.split('-').filter(f => f.trim())[0];
              const end = f.split('-').filter(f => f.trim())[1];
              if(start >= end) { return; }
              for(let p = start; p <= end; p++) {
                orderPorts.indexOf(p) >= 0 || orderPorts.push(p);
              }
            } else {
              orderPorts.indexOf(+f) >= 0 || orderPorts.push(+f);
            }
          });
        } catch(err) {
          console.log(err);
        }
      }
      return knex('webguiSetting').select().where({
        key: 'account',
      }).then(success => {
        if(!success.length) { return Promise.reject('settings not found'); }
        success[0].value = JSON.parse(success[0].value);
        return success[0].value.port;
      }).then(port => {
        if(port.random) {
          const getRandomPort = () => {
            if(orderPorts.length) {
              return orderPorts[Math.floor(Math.random() * orderPorts.length)];
            } else {
              return Math.floor(Math.random() * (port.end - port.start + 1) + port.start);
            }
          };
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
          let query;
          if(orderPorts.length) {
            query = knex('account_plugin').select()
            .whereIn('port', orderPorts)
            .orderBy('port', 'ASC');
          } else {
            query = knex('account_plugin').select()
            .whereBetween('port', [port.start, port.end])
            .orderBy('port', 'ASC');
          }
          return query.then(success => {
            const portArray = success.map(m => m.port);
            let myPort;
            if(orderPorts.length) {
              for(const p of orderPorts) {
                if(portArray.indexOf(+p) < 0) {
                  myPort = p; break;
                }
              }
            } else {
              for(let p = port.start; p <= port.end; p++) {
                if(portArray.indexOf(+p) < 0) {
                  myPort = p; break;
                }
              }
            }
            if(myPort) {
              return myPort;
            } else {
              return Promise.reject('no port');
            }
          });
        }
      });
    };
    const port = await getNewPort();
    await addAccount(orderType, {
      orderId,
      user: userId,
      port,
      password: Math.random().toString().substr(2,10),
      time: Date.now(),
      limit,
      flow: orderInfo.flow,
      server: orderInfo.server,
      autoRemove: orderInfo.autoRemove ? 1 : 0,
      autoRemoveDelay: orderInfo.autoRemoveDelay,
      multiServerFlow: orderInfo.multiServerFlow ? 1 : 0,
      active: orderInfo.active,
    });
    return;
  }

  const compareType = (current, order) => {
    if(current === order) { return false; }
    else if(current === 3) { return true; }
    else if(current === 2 && order !== 3) { return true; }
    else if(current === 4 && order === 5) { return true; }
    else { return false; }
  };
  const onlyIncreaseTime = compareType(account.type, orderType);
  if(onlyIncreaseTime) {
    const accountData = JSON.parse(account.data);
    const timePeriod = {
      '2': 7 * 86400 * 1000,
      '3': 30 * 86400 * 1000,
      '4': 1 * 86400 * 1000,
      '5': 3600 * 1000,
    };
    let expireTime = accountData.create + accountData.limit * timePeriod[account.type];
    if(expireTime <= Date.now()) {
      expireTime = timePeriod[orderType] * limit + Date.now();
    } else {
      expireTime += timePeriod[orderType] * limit;
    }
    let countTime = timePeriod[account.type];
    accountData.create = expireTime - countTime;
    accountData.limit = 1;
    while(accountData.create >= Date.now()) {
      accountData.limit += 1;
      accountData.create -= countTime;
    }
    await knex('account_plugin').update({
      data: JSON.stringify(accountData),
    }).where({ id: accountId });
    await accountFlow.edit(accountId);
    return;
  }

  const accountData = JSON.parse(account.data);
  accountData.flow = orderInfo.flow;
  const timePeriod = {
    '2': 7 * 86400 * 1000,
    '3': 30 * 86400 * 1000,
    '4': 1 * 86400 * 1000,
    '5': 3600 * 1000,
  };
  let expireTime = accountData.create + accountData.limit * timePeriod[account.type];
  if(expireTime <= Date.now()) {
    expireTime = timePeriod[orderType] * limit + Date.now();
  } else {
    expireTime += timePeriod[orderType] * limit;
  }
  let countTime = timePeriod[orderType];
  accountData.create = expireTime - countTime;
  accountData.limit = 1;
  while(accountData.create >= Date.now()) {
    accountData.limit += 1;
    accountData.create -= countTime;
  }
  // let port = await getAccount({ id: accountId }).then(success => success[0].port);
  await knex('account_plugin').update({
    type: orderType,
    orderId,
    data: JSON.stringify(accountData),
    server: orderInfo.server,
    autoRemove: orderInfo.autoRemove ? 1 : 0,
    multiServerFlow: orderInfo.multiServerFlow ? 1 : 0,
  }).where({ id: accountId });
  await accountFlow.edit(accountId);
  return;
};

const addAccountTime = async (userId, accountId, accountType, accountPeriod = 1) => {
  // type: 2 周 ,3 月, 4 天, 5 小时
  const getTimeByType = type => {
    const time = {
      '2': 7 * 24 * 60 * 60 * 1000,
      '3': 30 * 24 * 60 * 60 * 1000,
      '4': 24 * 60 * 60 * 1000,
      '5': 60 * 60 * 1000,
    };
    return time[type];
  };

  const paymentInfo = await knex('webguiSetting').select().where({
    key: 'payment',
  }).then(success => {
    if(!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value;
  });
  const getPaymentInfo = type => {
    const pay = {
      '2': 'week',
      '3': 'month',
      '4': 'day',
      '5': 'hour',
    };
    return paymentInfo[pay[type]];
  };
  
  const checkIfAccountExists = async (accountId) => {
    if(!accountId) { return null; }
    const account = await knex('account_plugin').where({ id: accountId });
    if(!account.length) { return null; }
    const accountInfo = account[0];
    accountInfo.data = JSON.parse(account[0].data);
    return accountInfo;
  };
  
  const accountInfo = await checkIfAccountExists(accountId);
  if(!accountInfo) {
    const getNewPort = async () => {
      const port = await knex('webguiSetting').select().where({
        key: 'account',
      }).then(success => {
        if(!success.length) { return Promise.reject('settings not found'); }
        success[0].value = JSON.parse(success[0].value);
        return success[0].value.port;
      });
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
    };
    const port = await getNewPort();
    await knex('account_plugin').insert({
      type: accountType,
      userId,
      server: getPaymentInfo(accountType).server ? JSON.stringify(getPaymentInfo(accountType).server) : null,
      port,
      password: Math.random().toString().substr(2,10),
      data: JSON.stringify({
        create: Date.now(),
        flow: getPaymentInfo(accountType).flow * 1000 * 1000,
        limit: accountPeriod,
      }),
      autoRemove: getPaymentInfo(accountType).autoRemove,
      multiServerFlow: getPaymentInfo(accountType).multiServerFlow,
    });
    return;
  }

  let onlyIncreaseTime = false;
  if(accountInfo.type === 3 && accountType !== 3) { onlyIncreaseTime = true; }
  if(accountInfo.type === 2 && (accountType === 4 || accountType === 5)) { onlyIncreaseTime = true; }
  if(accountInfo.type === 4 && accountType === 5) { onlyIncreaseTime = true; }

  const isAccountOutOfDate = accountInfo => {
    const expire = accountInfo.data.create + accountInfo.data.limit * getTimeByType(accountInfo.type);
    return expire <= Date.now();
  };

  if(onlyIncreaseTime) {
    let expireTime;
    if(isAccountOutOfDate(accountInfo)) {
      expireTime = Date.now() + getTimeByType(accountType) * accountPeriod;
    } else {
      expireTime = accountInfo.data.create + getTimeByType(accountInfo.type) * accountInfo.data.limit + getTimeByType(accountType) * accountPeriod;
    }
    let createTime = expireTime - getTimeByType(accountInfo.type);
    let limit = 1;
    while(createTime >= Date.now()) {
      limit += 1;
      createTime -= getTimeByType(accountInfo.type);
    }
    await knex('account_plugin').update({
      data: JSON.stringify({
        create: createTime,
        flow: accountInfo.data.flow,
        limit,
      }),
    }).where({ id: accountId });
    return;
  }

  let expireTime;
  if(isAccountOutOfDate(accountInfo)) {
    expireTime = Date.now() + getTimeByType(accountType) * accountPeriod;
  } else {
    expireTime = accountInfo.data.create + getTimeByType(accountInfo.type) * accountInfo.data.limit + getTimeByType(accountType) * accountPeriod;
  }
  let createTime = expireTime - getTimeByType(accountType);
  let limit = 1;
  while(createTime >= Date.now()) {
    limit += 1;
    createTime -= getTimeByType(accountType);
  }
  await knex('account_plugin').update({
    type: accountType,
    server: getPaymentInfo(accountType).server ? JSON.stringify(getPaymentInfo(accountType).server) : null,
    data: JSON.stringify({
      create: createTime,
      flow: getPaymentInfo(accountType).flow * 1000 * 1000,
      limit,
    }),
    autoRemove: getPaymentInfo(accountType).autoRemove,
    multiServerFlow: getPaymentInfo(accountType).multiServerFlow,
  }).where({ id: accountId });
  return;
};

const banAccount = async options => {
  const serverId = options.serverId;
  const accountId = options.accountId;
  const time = options.time;
  await knex('account_flow').update({
    status: 'ban',
    nextCheckTime: Date.now(),
    autobanTime: Date.now() + time,
  }).where({
    serverId, accountId,
  });
};

const getBanAccount = async options => {
  const serverId = options.serverId;
  const accountId = options.accountId;
  const accountInfo = await knex('account_flow').select([
    'autobanTime as banTime'
  ]).where({
    serverId, accountId, status: 'ban'
  });
  if(!accountInfo.length) { return { banTime: 0 }; }
  return accountInfo[0];
};

const loginLog = {};
const scanLoginLog = ip => {
  for(let i in loginLog) {
    if(Date.now() - loginLog[i].time >= 10 * 60 * 1000) {
      delete loginLog[i];
    }
  }
  if(!loginLog[ip]) {
    return false;
  } else if (loginLog[ip].mac.length <= 10) {
    return false;
  } else {
    return true;
  }
};
const loginFail = (mac, ip) => {
  if(!loginLog[ip]) {
    loginLog[ip] = { mac: [ mac ], time: Date.now() };
  } else {
    if(loginLog[ip].mac.indexOf(mac) < 0) {
      loginLog[ip].mac.push(mac);
      loginLog[ip].time = Date.now();
    }
  }
};

const getAccountForSubscribe = async (token, ip) => {
  if(scanLoginLog(ip)) {
    return Promise.reject('ip is in black list');
  }
  const account = await knex('account_plugin').where({
    subscribe: token
  }).then(s => s[0]);
  if(!account) {
    loginFail(token, ip);
    return Promise.reject('can not find account');
  }
  if(account.data) {
    account.data = JSON.parse(account.data);
  } else {
    account.data = {};
  }
  if(account.server) {
    account.server = JSON.parse(account.server);
  }
  const servers = (await serverManager.list({ status: false })).filter(server => server.type === 'Shadowsocks');
  const validServers = servers.filter(server => {
    if(!account.server) { return true; }
    return account.server.indexOf(server.id) >= 0;
  });
  return { server: validServers, account };
};

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

const editMultiAccounts = async (orderId, update) => {
  const accounts = await knex('account_plugin').where({ orderId });
  const updateData = {};
  for(const account of accounts) {
    if(update.hasOwnProperty('flow')) {
      const accountData = JSON.parse(account.data);
      accountData.flow = update.flow;
      updateData.data = JSON.stringify(accountData);
    }
    if(update.hasOwnProperty('server')) {
      updateData.server = update.server ? JSON.stringify(update.server): null;
    }
    if(update.hasOwnProperty('autoRemove')) {
      updateData.autoRemove = update.autoRemove;
    }
    if(Object.keys(updateData).length === 0) { break; }
    await knex('account_plugin').update(updateData).where({ id: account.id });
    await accountFlow.edit(account.id);
    await sleep(500);
  }
};

const activeAccount = async accountId => {
  const accountInfo = await getAccount({ id: accountId }).then(s => s[0]);
  await knex('account_plugin').update({ active: 1 }).where({ id: accountInfo.id });
  await accountFlow.edit(accountInfo.id);
  if(accountInfo.type > 1) {
    const accountData = JSON.parse(accountInfo.data);
    accountData.create = Date.now();
    await knex('account_plugin').update({ data: JSON.stringify(accountData) }).where({ id: accountInfo.id });
  }
};

const getAccountAndPaging = async (opt) => {
  const search = opt.search || '';
  const page = opt.page || 1;
  const pageSize = opt.pageSize || 20;
  const sort = opt.sort || 'port_asc';
  const filter = opt.filter;

  const where = {};
  if(filter.orderId) {
    where['account_plugin.orderId'] = +filter.orderId;
  }
  
  let account = knex('account_plugin').select([
    'account_plugin.id',
    'account_plugin.type',
    'account_plugin.orderId',
    'account_plugin.userId',
    'account_plugin.server',
    'account_plugin.port',
    'account_plugin.password',
    'account_plugin.key',
    'account_plugin.data',
    'account_plugin.status',
    'account_plugin.autoRemove',
    'account_plugin.autoRemoveDelay',
    'account_plugin.multiServerFlow',
    'account_plugin.active',
    'user.id as userId',
    'user.email as user',
  ])
  .leftJoin('user', 'user.id', 'account_plugin.userId')
  .orderBy('account_plugin.port', 'ASC')
  .where(where);

  if(!filter.hasUser && filter.noUser) {
    account = await account.whereNull('user.id');
  } else if(filter.hasUser && !filter.noUser) {
    account = await account.whereNotNull('user.id');
  } else {
    account = await account;
  }

  account.forEach(a => {
    if(a.data) {
      a.data = JSON.parse(a.data);
      const time = {
        '2': 7 * 24 * 3600000,
        '3': 30 * 24 * 3600000,
        '4': 24 * 3600000,
        '5': 3600000,
      };
      a.data.expire = a.data.create + a.data.limit * time[a.type];
    }
  });
  if(filter.mac) {
    const macAccounts = await macAccount.getAllAccount();
    account.splice(account.length, 0, ...macAccounts);
  }
  if(search) {
    account = account.filter(f => {
      return (
        (f.user && f.user.includes(search)) ||
        (f.port && f.port.toString().includes(search)) ||
        (f.password && f.password.includes(search)) ||
        (f.mac && f.mac.includes(search))
      );
    });
  }
  account = account.filter(f => {
    let show = true;
    if(!filter.unlimit && f.type === 1) {
      show = false;
    }
    if(!filter.expired && f.data && f.data.expire >= Date.now()) {
      show = false;
    }
    if(!filter.unexpired && f.data && f.data.expire <= Date.now()) {
      show = false;
    }
    return show;
  });
  account = account.sort((a, b) => {
    if(a.mac && !b.mac) {
      return 1;
    } else if(!a.mac && b.mac) {
      return -1;
    } else if(sort === 'port_asc') {
      return a.port >= b.port ? 1 : -1;
    } else if (sort === 'port_desc') {
      return a.port <= b.port ? 1 : -1;
    } else if (sort === 'expire_desc') {
      if(!a.data) { return -1; }
      if(!b.data) { return 1; }
      return a.data.expire <= b.data.expire ? 1 : -1;
    } else if (sort === 'expire_asc') {
      if(!a.data) { return 1; }
      if(!b.data) { return -1; }
      return a.data.expire >= b.data.expire ? 1 : -1;
    }
  });

  const count = account.length;
  const start = pageSize * (page - 1);
  const end = start + pageSize;
  const result = account.slice(start, end);
  
  const maxPage = Math.ceil(count / pageSize);
  return {
    total: count,
    page,
    maxPage,
    pageSize,
    account: result,
  };
};

exports.addAccount = addAccount;
exports.getAccount = getAccount;
exports.delAccount = delAccount;
exports.editAccount = editAccount;
exports.editAccountTime = editAccountTime;
exports.editAccountTimeForRef = editAccountTimeForRef;

exports.changePassword = changePassword;
exports.changePort = changePort;

exports.addAccountLimit = addAccountLimit;
exports.addAccountLimitToMonth = addAccountLimitToMonth;
exports.setAccountLimit = setAccountLimit;
exports.addAccountTime = addAccountTime;

exports.banAccount = banAccount;
exports.getBanAccount = getBanAccount;

exports.getAccountForSubscribe = getAccountForSubscribe;

exports.editMultiAccounts = editMultiAccounts;

exports.activeAccount = activeAccount;
exports.getOnlineAccount = getOnlineAccount;

exports.getAccountAndPaging = getAccountAndPaging;
