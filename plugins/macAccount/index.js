const knex = appRequire('init/knex').knex;
const serverPlugin = appRequire('plugins/flowSaver/server');
const accountPlugin = appRequire('plugins/account/index');
const flow = appRequire('plugins/flowSaver/flow');
const dns = require('dns');
const net = require('net');
const config = appRequire('services/config').all();
const redis = appRequire('init/redis').redis;

const formatMacAddress = mac => mac.replace(/-/g, '').replace(/:/g, '').toLowerCase();

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

const getIp = address => {
  let myAddress = address;
  if(address.indexOf(':') >= 0) {
    const hosts = address.split(':');
    const number = Math.ceil(Math.random() * (hosts.length - 1));
    myAddress = hosts[number];
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

const getAccount = async (userId, group) => {
  const where = {};
  where['mac_account.userId'] = userId;
  if(group >= 0) {
    where['user.group'] = group;
  }
  const macAccounts = await knex('mac_account').select([
    'mac_account.id as id',
    'mac_account.userId as userId',
    'mac_account.mac as mac',
    'mac_account.accountId as accountId',
    'mac_account.serverId as serverId',
  ]).where(where).leftJoin('user', 'user.id', 'mac_account.userId');
  const accounts = await knex('account_plugin').where({ userId });
  macAccounts.forEach(macAccount => {
    const isExists = accounts.filter(f => {
      return f.id === macAccount.accountId;
    })[0];
    if(!isExists && accounts.length) {
      knex('mac_account').update({
        accountId: accounts[0].id
      }).where({
        id: macAccount.id
      }).then();
    }
  });
  return macAccounts;
};

const getNoticeForUser = async (mac, ip) => {
  if(scanLoginLog(ip)) {
    return Promise.reject('ip is in black list');
  }
  const macAccount = await knex('mac_account').where({ mac }).then(success => success[0]);
  if(!macAccount) {
    loginFail(mac, ip);
    return Promise.reject('mac account not found');
  }
  const userId = macAccount.userId;
  // const groupInfo = await knex('user').select([
  //   'group.id as id',
  //   'group.showNotice as showNotice',
  // ]).innerJoin('group', 'user.group', 'group.id').where({
  //   'user.id': userId,
  // }).then(s => s[0]);
  // const group = [groupInfo.id];
  // if(groupInfo.showNotice) { group.push(-1); }
  // const notices = await knex('notice').select().whereIn('group', group).orderBy('time', 'desc');
  const noticesWithoutGroup = await knex('notice').where({ group: 0 });
  const noticesWithGroup = await knex('notice').select([
    'notice.id as id',
    'notice.title as title',
    'notice.content as content',
    'notice.time as time',
    'notice.group as group',
    'notice.autopop as autopop',
  ])
  .innerJoin('notice_group', 'notice.id', 'notice_group.noticeId')
  .innerJoin('user', 'user.group', 'notice_group.groupId')
  .where('notice.group', '>', 0)
  .where({ 'user.id': userId })
  .groupBy('notice.id');
  const notices = [...noticesWithoutGroup, ...noticesWithGroup ].sort((a, b) => b.time - a.time);
  return notices;
};

const getAccountForUser = async (mac, ip, opt) => {
  const noPassword = opt.noPassword;
  const noFlow = opt.noFlow;
  let type = opt.type;
  if(type !== 'WireGuard') { type = 'Shadowsocks'; }
  if(scanLoginLog(ip)) {
    return Promise.reject('ip is in black list');
  }
  const macAccount = await knex('mac_account').where({ mac }).then(success => success[0]);
  if(!macAccount) {
    loginFail(mac, ip);
    return Promise.reject('mac account not found');
  }
  await getAccount(macAccount.userId);
  const myServerId = macAccount.serverId;
  const myAccountId = macAccount.accountId;
  const accounts = await knex('mac_account').select([
    'mac_account.id',
    'mac_account.mac',
    'account_plugin.id as accountId',
    'account_plugin.port',
    'account_plugin.password',
    'account_plugin.multiServerFlow as multiServerFlow',
    'account_plugin.key',
  ])
  .leftJoin('user', 'mac_account.userId', 'user.id')
  .leftJoin('account_plugin', 'mac_account.userId', 'account_plugin.userId');
  const account = accounts.filter(a => {
    return a.accountId === myAccountId;
  })[0];
  const accountData = (await accountPlugin.getAccount({ id: myAccountId }))[0];
  accountData.data = JSON.parse(accountData.data);
  let startTime = 0;
  let endTime;
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
    endTime = startTime + timePeriod;
    expire = accountData.data.create + accountData.data.limit * timePeriod;
  }
  const isMultiServerFlow = account.multiServerFlow;
  const servers = (await serverPlugin.list({ status: false })).filter(server => server.type === type);
  let server = servers.filter(s => {
    return s.id === myServerId;
  })[0];
  if(!server) {
    server = servers[0];
  }
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
        endpointPort: f.wgPort,
        publicKey: f.key,
        gateway: f.net,
      };
      return serverInfo;
    }).then(success => {
      if(startTime && !noFlow) {
        return flow.getServerPortFlowWithScale(success.id, account.accountId, [startTime, endTime], isMultiServerFlow).then(s => s[0]);
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
      return knex('account_flow').select(['status']).where({
        serverId: f.id,
        accountId: account.accountId,
      }).then(s => {
        if(!s.length) { return 'checked'; }
        return s[0].status;
      });
    }).then(success => {
      serverInfo.status = success;
      if(f.type === 'Shadowsocks') {
        serverInfo.base64 = 'ss://' + Buffer.from(server.method + ':' + server.password + '@' + serverInfo.address + ':' + account.port).toString('base64');
      } else {
        let privateKey = account.key || '';
        if(privateKey.includes(':')) {
          privateKey = privateKey.split(':')[1];
        }
        const a = account.port % 254;
        const b = (account.port - a) / 254;
        const address = `${ f.net.split('.')[0] }.${ f.net.split('.')[1] }.${ b }.${ a + 1 }`;
        serverInfo.endpointHost = serverInfo.address;
        serverInfo.address = address;
        serverInfo.base64 = `wg://${ serverInfo.address }:${ f.wgPort }?prikey=${ privateKey }&pubkey=${ f.key }&gateway=${ f.net }&address=${ address }#${ serverInfo.name }`;
      }
      return serverInfo;
    });
  });
  const serverReturn = await Promise.all(serverList);
  const data = {
    default: {
      site: (config.plugins.macAccount ? config.plugins.macAccount.site : null) || config.plugins.webgui.site,
      id: server.id,
      name: server.name,
      address,
      port: account.port + server.shift,
      password: account.password,
      method: server.method,
      comment: server.comment,
      currentFlow: await flow.getServerPortFlowWithScale(server.id, account.accountId, [startTime, endTime], isMultiServerFlow).then(s => s[0]),
    },
    servers: serverReturn,
  };
  if(accountData.key) {
    data.default.privateKey = accountData.key.includes(':') ? accountData.key.split(':')[1] : accountData.key;
  }
  if(noPassword) {
    delete data.default.password;
  }
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
  return knex('mac_account').delete().where({ id }).then();
};

const login = async (mac, ip) => {
  // if(scanLoginLog(ip)) {
  //   return Promise.reject('ip is in black list');
  // }
  const failNumber = await redis.scard(`Temp:MacLoginFail:${ ip }`);
  if(+failNumber >= 10) {
    return Promise.reject('mac login out of limit');
  }
  const account = await knex('mac_account').where({
    mac: formatMacAddress(mac)
  }).then(success => success[0]);
  if(!account) {
    // loginFail(mac, ip);
    await redis.sadd(`Temp:MacLoginFail:${ ip }`, mac);
    await redis.expire(`Temp:MacLoginFail:${ ip }`, 120);
    return Promise.reject('mac account not found');
  } else {
    return account;
  }
};

const getAccountByAccountId = accountId => {
  return knex('mac_account').where({
    accountId
  });
};

const getAllAccount = async group => {
  const where = {};
  if(group >= 0) {
    where['user.group'] = group;
  }
  const accounts = await knex('mac_account').select([
    'mac_account.id as id',
    'mac_account.mac as mac',
    'mac_account.userId as userId',
    'mac_account.accountId as accountId',
    'mac_account.serverId as serverId',
    'account_plugin.port as port',
  ]).leftJoin('account_plugin', 'mac_account.accountId', 'account_plugin.id')
  .leftJoin('user', 'user.id', 'mac_account.userId')
  .where(where);
  return accounts;
};

const getAccountByUserId = userId => {
  return knex('mac_account').where({
    userId
  });
};

const removeInvalidMacAccount = async () => {
  const accounts = await knex('mac_account').select([
    'mac_account.id as id',
    'mac_account.mac as mac',
    'mac_account.userId as userId',
    'mac_account.accountId as accountId',
    'mac_account.serverId as serverId',
    'user.username as username',
  ]).leftJoin('user', 'mac_account.userId', 'user.id')
  .where({});
  accounts.filter(f => {
    return f.username === null;
  }).forEach(account => {
    knex('mac_account').where({ id: account.id }).del().then();
  });
};
removeInvalidMacAccount();

const isMacAddress = mac => mac.match(/^[0-9,a-f]{12}$/);

const userAddMacAccount = async (userId, mac) => {
  const macAddress = formatMacAddress(mac);
  if(!isMacAddress(macAddress)) { return Promise.reject(); }
  const currentMacAccount = await knex('mac_account').where({ userId });
  const insertData = {
    mac: macAddress,
    userId,
  };
  if(currentMacAccount.length) { return Promise.reject(); }
  const userAccount = await knex('account_plugin').where({ userId });
  if(userAccount.length) {
    insertData.accountId = userAccount[0].id;
  }
  await knex('mac_account').insert(insertData);
  return;
};

const getMacAccountForSubscribe = async (mac, ip) => {
  if(scanLoginLog(ip)) {
    return Promise.reject('ip is in black list');
  }
  const macAccount = await knex('mac_account').where({ mac }).then(success => success[0]);
  if(!macAccount) {
    loginFail(mac, ip);
    return Promise.reject('mac account not found');
  }
  await getAccount(macAccount.userId);
  const myAccountId = macAccount.accountId;
  const accounts = await knex('mac_account').select([
    'mac_account.id',
    'mac_account.mac',
    'account_plugin.id as accountId',
  ])
  .leftJoin('user', 'mac_account.userId', 'user.id')
  .leftJoin('account_plugin', 'mac_account.userId', 'account_plugin.userId');
  const myAccount = accounts.filter(a => {
    return a.accountId === myAccountId;
  })[0];
  const account = await knex('account_plugin').where({
    id: myAccount.accountId
  }).then(s => s[0]);
  if(!account) {
    loginFail(mac, ip);
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
  const servers = (await serverPlugin.list({ status: false })).filter(server => server.type === 'Shadowsocks');
  const validServers = servers.filter(server => {
    if(!account.server) { return true; }
    return account.server.indexOf(server.id) >= 0;
  });
  return { server: validServers, account };
};

exports.editAccount = editAccount;
exports.newAccount = newAccount;
exports.getAccount = getAccount;
exports.deleteAccount = deleteAccount;
exports.getAccountForUser = getAccountForUser;
exports.getNoticeForUser = getNoticeForUser;
exports.login = login;
exports.getAccountByAccountId = getAccountByAccountId;
exports.getAllAccount = getAllAccount;
exports.getAccountByUserId = getAccountByUserId;

exports.userAddMacAccount = userAddMacAccount;
exports.getMacAccountForSubscribe = getMacAccountForSubscribe;
