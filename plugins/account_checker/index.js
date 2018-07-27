const log4js = require('log4js');
const logger = log4js.getLogger('account');
const knex = appRequire('init/knex').knex;
const cron = appRequire('init/cron');
const flow = appRequire('plugins/flowSaver/flow');
const manager = appRequire('services/manager');
const config = appRequire('services/config').all();
const sleepTime = 150;
const accountFlow = appRequire('plugins/account/accountFlow');

const sleep = time => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), time);
  });
};

const randomInt = max => {
  return Math.ceil(Math.random() * max % max);
};

const modifyAccountFlow = async (serverId, accountId, time) => {
  await knex('account_flow').update({
    checkTime: Date.now(),
    nextCheckTime: Date.now() + time,
  }).where({ serverId, accountId });
};

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

const isBaned = async (server, account) => {
  const accountFlowInfo = await knex('account_flow').where({
    serverId: server.id,
    accountId: account.id,
    status: 'ban',
  }).then(s => s[0]);
  if(!accountFlowInfo) { return false; }
  if(!accountFlowInfo.autobanTime || Date.now() > accountFlowInfo.autobanTime) {
    await knex('account_flow').update({ status: 'checked' }).where({ id: accountFlowInfo.id });
    return false;
  }
  await knex('account_flow').update({ nextCheckTime: accountFlowInfo.autobanTime }).where({ id: accountFlowInfo.id });
  return true;
};

const isOverFlow = async (server, account) => {
  let realFlow = 0;
  const writeFlow = async (serverId, accountId, flow, time) => {
    const exists = await knex('account_flow').where({ serverId, accountId }).then(s => s[0]);
    if(exists) {
      await knex('account_flow').update({
        flow,
        checkTime: Date.now(),
        nextCheckTime: Date.now() + time,
      }).where({ id: exists.id });
    }
  };
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
    const endTime = Date.now();

    const isMultiServerFlow = !!account.multiServerFlow;

    let servers = [];
    if(isMultiServerFlow) {
      servers = await knex('server').where({});
    } else {
      servers = await knex('server').where({ id: server.id });
    }

    const flows = await flow.getFlowFromSplitTimeWithScale(servers.map(m => m.id), account.id, startTime, endTime);

    const serverObj = {};
    servers.forEach(server => {
      serverObj[server.id] = server;
    });
    flows.forEach(flo => {
      flo.forEach(f => {
        if(serverObj[f.id]) {
          if(!serverObj[f.id].flow) {
            serverObj[f.id].flow = f.sumFlow;
          } else {
            serverObj[f.id].flow += f.sumFlow;
          }
        }
      });
    });
    let sumFlow = 0;
    for(const s in serverObj) {
      const flow = serverObj[s].flow || 0;
      if(+s === server.id) { realFlow = flow; }
      sumFlow += Math.ceil(flow * serverObj[s].scale);
    }
    const nextCheckTime = (data.flow - sumFlow) / 200000000 * 60 * 1000;
    await writeFlow(server.id, account.id, realFlow, nextCheckTime <= 0 ? 600 * 1000 : nextCheckTime);

    return sumFlow >= data.flow;
  } else {
    await writeFlow(server.id, account.id, 0, 30 * 60 * 1000 + Number(Math.random().toString().substr(2, 7)));
    return false;
  }
};

const deletePort = (server, account) => {
  // console.log(`del ${ server.name } ${ account.port }`);
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
  // console.log(`add ${ server.name } ${ account.port }`);
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

const deleteExtraPorts = async serverInfo => {
  try {
    const currentPorts = await manager.send({ command: 'list' }, {
      host: serverInfo.host,
      port: serverInfo.port,
      password: serverInfo.password,
    });
    for(let p of currentPorts) {
      await sleep(sleepTime);
      const accountInfo = await knex('account_plugin').where({
        port: p.port - serverInfo.shift
      }).then(s => s[0]);
      if(!accountInfo) {
        deletePort(serverInfo, { port: p.port });
      } else if(accountInfo.server && JSON.parse(accountInfo.server).indexOf(serverInfo.id) < 0) {
        await knex('account_plugin').delete().where({ serverId, port: p.port - serverInfo.shift });
        deletePort(serverInfo, accountInfo);
      }
    }
  } catch(err) {
    console.log(err);
  }
};

const checkAccount = async (serverId, accountId) => {
  try {
    const serverInfo = await knex('server').where({ id: serverId }).then(s => s[0]);
    if(!serverInfo) { return Promise.reject(`Server[${ serverId }] not exists`); }
    const accountInfo = await knex('account_plugin').where({ id: accountId }).then(s => s[0]);
    if(!accountInfo) {
      await knex('account_flow').delete().where({ serverId, accountId });
      return;
    }
    // logger.info('check', serverInfo.name, accountInfo.port);

    // 检查当前端口是否存在
    const exists = await isPortExists(serverInfo, accountInfo);

    // 检查账号是否包含该服务器
    if(!hasServer(serverInfo, accountInfo)) {
      await modifyAccountFlow(serverInfo.id, accountInfo.id, 20 * 60 * 1000 + randomInt(30000));
      exists && deletePort(serverInfo, accountInfo);
      return;
    }

    // 检查账号是否过期
    if(isExpired(serverInfo, accountInfo)) {
      await modifyAccountFlow(serverInfo.id, accountInfo.id, 10 * 60 * 1000 + randomInt(30000));
      exists && deletePort(serverInfo, accountInfo);
      return;
    }

    // 检查账号是否被ban
    if(await isBaned(serverInfo, accountInfo)) {
      exists && deletePort(serverInfo, accountInfo);
      return;
    }

    // 检查账号是否超流量
    if(await isOverFlow(serverInfo, accountInfo)) {
      exists && deletePort(serverInfo, accountInfo);
      return;
    }

    !exists && addPort(serverInfo, accountInfo);
  } catch(err) {
    console.log(err);
  }
};

// cron.minute(async () => {
(async () => {
  await sleep(sleepTime);
  const servers = await knex('server').where({});
  for(let server of servers) {
    await sleep(sleepTime);
    await deleteExtraPorts(server);
  }
  const accounts = await knex('account_plugin').where({});
  for(let account of accounts) {
    await sleep(sleepTime);
    await accountFlow.add(account.id);
  }
})();
// }, 5);

(async () => {
  while(true) {
    const start = Date.now();
    let number = 0;
    try {
      const datas = await knex('account_flow').select()
      .orderBy('nextCheckTime', 'asc').limit(30);
      number += datas.length;
      for(const data of datas) {
        await checkAccount(data.serverId, data.accountId).catch();
        await sleep(sleepTime);
      }
    } catch(err) {
      console.log(err);
    }

    try {
      const datas = await knex('account_flow').select()
      .orderBy('updateTime', 'desc').limit(15);
      number += datas.length;
      for(const data of datas) {
        await checkAccount(data.serverId, data.accountId).catch();
        await sleep(sleepTime);
      }
    } catch(err) {
      console.log(err);
    }

    try {
      let datas;
      try {
        datas = await knex('account_flow').select()
        .orderByRaw('rand()').limit(5);
      } catch(err) {
        datas = await knex('account_flow').select()
        .orderByRaw('random()').limit(5);
      }
      number += datas.length;
      for(const data of datas) {
        await checkAccount(data.serverId, data.accountId).catch();
        await sleep(sleepTime);
      }
    } catch(err) {
      console.log(err);
    }
    await sleep(sleepTime);
    if(number) {
      logger.info(`check ${ number } accounts, ${ Date.now() - start } ms`);
    }
  }
})();
