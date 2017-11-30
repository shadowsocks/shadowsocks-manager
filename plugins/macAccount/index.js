const knex = appRequire('init/knex').knex;
const serverPlugin = appRequire('plugins/flowSaver/server');
const accountPlugin = appRequire('plugins/account/index');
const flow = appRequire('plugins/flowSaver/flow');
const dns = require('dns');
const net = require('net');

const formatMacAddress = mac => {
  return mac.replace(/-/g, '').replace(/:/g, '').toLowerCase();
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
  } else if (loginLog[ip].number <= 5) {
    return false;
  } else {
    return true;
  }
};
const loginFail = ip => {
  if(!loginLog[ip]) {
    loginLog[ip] = { number: 1, time: Date.now() };
  } else {
    loginLog[ip] = { number: loginLog[ip].number + 1, time: Date.now() };
  }
};

const getIp = address => {
  let myAddress = address;
  if(address.indexOf(':') >= 0) {
    myAddress = address.split(':')[1];
  }
  if(net.isIP(myAddress)) {
    return Promise.resolve(myAddress);
  }
  return new Promise((resolve, reject) => {
    dns.lookup(myAddress, (err, myAddress, family) => {
      if(err) {
        return reject(err);
      }
      return resolve(myAddress);
    });
  });
};

const newAccount = (mac, userId, serverId, accountId) => {
  return knex('mac_account').insert({
    mac, userId, serverId, accountId,
  });
};

const getAccount = async userId => {
  const accounts = await knex('mac_account').where({
    'mac_account.userId': userId,
  });
  return accounts;
};

const getAccountForUser = async (mac, ip) => {
  if(scanLoginLog(ip)) {
    return Promise.reject('ip is in black list');
  }
  const macAccount = await knex('mac_account').where({ mac }).then(success => success[0]);
  if(!macAccount) {
    loginFail(ip);
    return Promise.reject('mac account not found');
  }
  const myServerId = macAccount.serverId;
  const myAccountId = macAccount.accountId;
  const accounts = await knex('mac_account').select([
    'mac_account.id',
    'mac_account.mac',
    'account_plugin.id as accountId',
    'account_plugin.port',
    'account_plugin.password',
  ])
  .leftJoin('user', 'mac_account.userId', 'user.id')
  .leftJoin('account_plugin', 'mac_account.userId', 'account_plugin.userId');
  const account = accounts.filter(a => {
    return a.accountId === myAccountId;
  })[0];
  const accountData = (await accountPlugin.getAccount({ id: myAccountId }))[0];
  accountData.data = JSON.parse(accountData.data);
  let startTime = 0;
  let expire = 0;
  if(accountData.type >= 2 && accountData.type <= 5) {
    let timePeriod = 0;
    if(accountData.type === 2) { timePeriod = 7 * 86400 * 1000; }
    if(accountData.type === 3) { timePeriod = 30 * 86400 * 1000; }
    if(accountData.type === 4) { timePeriod = 1 * 86400 * 1000; }
    if(accountData.type === 5) { timePeriod = 3600 * 1000; }
    startTime = accountData.data.create;
    while(startTime + timePeriod <= Date.now()) {
      startTime += timePeriod;
    }
    expire = accountData.data.create + accountData.data.limit * timePeriod;
  }
  const isMultiServerFlow = await knex('webguiSetting')
  .select()
  .where({ key: 'account' })
  .then(success => {
    if(!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value.multiServerFlow;
  });
  const servers = await serverPlugin.list({ status: false });
  const server = servers.filter(s => {
    return s.id === myServerId;
  })[0];
  const address = await getIp(server.host);
  const validServers = JSON.parse(accountData.server);
  const serverList = servers.filter(f => {
    if(!validServers) {
      return true;
    } else {
      return validServers.indexOf(f.id) >= 0;
    }
  }).map(f => {
    let serverInfo;
    return getIp(f.host).then(success => {
      serverInfo = {
        id: f.id,
        name: f.name,
        address: success,
        port: account.port + f.shift,
        method: f.method,
        comment: f.comment,
      };
      return serverInfo;
    }).then(success => {
      if(startTime) {
        return flow.getFlowFromSplitTime(isMultiServerFlow ? null : success.id, account.accountId, startTime, Date.now());
      } else {
        return -1;
      }
    }).then(success => {
      serverInfo.currentFlow = success;
      if(startTime) {
        serverInfo.flow = accountData.data.flow * (isMultiServerFlow ? 1 : f.scale);
      } else {
        serverInfo.flow = -1;
      }
      serverInfo.expire = expire || null;
      return serverInfo;
    });
  });

  const serverReturn = await Promise.all(serverList);
  const data = {
    default: {
      id: server.id,
      name: server.name,
      address,
      port: account.port + server.shift,
      password: account.password,
      method: server.method,
      comment: server.comment,
    },
    servers: serverReturn,
  };
  if(!serverReturn.filter(f => f.name === server.name)[0]) {
    data.default.name = serverReturn[0].name;
    data.default.address = serverReturn[0].address;
  }
  return data;
};

const editAccount = (id, mac, serverId, accountId) => {
  return knex('mac_account').update({
    mac, serverId, accountId,
  }).where({ id });
};

const deleteAccount = id => {
  return knex('mac_account').delete().where({ id });
};

const login = async (mac, ip) => {
  if(scanLoginLog(ip)) {
    return Promise.reject('ip is in black list');
  }
  const account = await knex('mac_account').where({
    mac: formatMacAddress(mac)
  }).then(success => success[0]);
  if(!account) {
    loginFail(ip);
    return Promise.reject('mac account not found');
  } else {
    return account;
  }
};

exports.editAccount = editAccount;
exports.newAccount = newAccount;
exports.getAccount = getAccount;
exports.deleteAccount = deleteAccount;
exports.getAccountForUser = getAccountForUser;
exports.login = login;