import { createContext } from "vm";

const knex = appRequire('init/knex').knex;
const cron = appRequire('init/cron');
const manager = appRequire('services/manager');

const isPortExists = async (server, account) => {
  const ports = (await manager.send({ command: 'list' }, {
    host: server.host,
    port: server.port,
    password: server.password,
  })).map(m => m.port);
  if(ports.indexOf(server.shift + account.port) >= 0) {
    return true;
  } else {
    return false;
  }
};

const hasServer = (server, account) => {
  if(!account.server) { return true; }
  const serverList = JSON.parse(account.server);
  if(serverList.indexOf(server.id) >= 0) { return true; }
  return false;
};

const isExpired = (server, account) => {
  if(account.type >= 2 && account.type <= 5) {
    let timePeriod = 0;
    if(account.type === 2) { timePeriod = 7 * 86400 * 1000; }
    if(account.type === 3) { timePeriod = 30 * 86400 * 1000; }
    if(account.type === 4) { timePeriod = 1 * 86400 * 1000; }
    if(account.type === 5) { timePeriod = 3600 * 1000; }
    const data = JSON.parse(account.data);
    let startTime = data.create;
    while(startTime + timePeriod <= Date.now()) {
      startTime += timePeriod;
    }
    if(data.create + data.limit * timePeriod <= Date.now() || data.create >= Date.now()) {
      if(account.autoRemove) {
        knex('account_plugin').delete().where({ id: account.id }).then();
      }
      return true;
    }
  } else {
    return false;
  }
};

const isOverFlow = () => {

};

const deletePort = (server, account) => {
  const portNumber = server.shift + account.port;
  manager.send({
    command: 'del',
    port: portNumber,
  }, {
    host: server.host,
    port: server.port,
    password: server.password,
  });
};

const addPort = (server, account) => {
  const portNumber = server.shift + account.port;
  manager.send({
    command: 'add',
    port: portNumber,
    password: account.password,
  }, {
    host: server.host,
    port: server.port,
    password: server.password,
  });
};

const checkAccount = async (serverId, accountId) => {
  try {
    const serverInfo = await knex('server').where({ id: serverId }).then(s => s[0]);
    if(!serverInfo) { return Promise.reject(`Server[${ serverId }] not exists`); }
    const accountInfo = await knex('account_plugin').where({ id: accountId }).then(s => s[0]);
    if(!accountInfo) { return Promise.reject(`Account[${ accountId }] not exists`); }

    // 检查当前端口是否存在
    const exists = await isPortExists(serverInfo, accountInfo);

    // 检查账号是否包含该服务器
    if(!hasServer(serverInfo, accountInfo)) {
      exists && deletePort(serverInfo, accountInfo);
      return;
    }

    // // 检查账号是否过期
    // if(isExpired(serverInfo, accountInfo)) {
    //   exists && deletePort(serverInfo, accountInfo);
    //   return;
    // }

    // // 检查账号是否超流量
    // if(isOverFlow) {
    //   exists && deletePort(serverInfo, accountInfo);
    //   return;
    // }

    // !exists && addPort();
  } catch(err) {
    console.log(err);
  }
};

cron.second(async () => {
  const start = Date.now();
  const test = await checkAccount(6, 5);
  const end = Date.now();
  console.log(test);
  console.log(end - start + ' ms');
}, 30);
