const log4js = require('log4js');
const logger = log4js.getLogger('account');
const knex = appRequire('init/knex').knex;
const flow = appRequire('plugins/flowSaver/flow');
const manager = appRequire('services/manager');
const config = appRequire('services/config').all();
const sleepTime = 100;
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

const isAccountActive = (server, account) => {
  return !!account.active;
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
    const expireTime = data.create + data.limit * timePeriod;
    account.expireTime = expireTime;
    if(expireTime <= Date.now() || data.create >= Date.now()) {
      const nextCheckTime = 10 * 60 * 1000 + randomInt(30000);
      if(account.active && account.autoRemove && expireTime + account.autoRemoveDelay < Date.now()) {
        modifyAccountFlow(server.id, account.id, nextCheckTime > account.autoRemoveDelay ? account.autoRemoveDelay : nextCheckTime);
        knex('account_plugin').delete().where({ id: account.id }).then();
      } else {
        modifyAccountFlow(server.id, account.id, nextCheckTime);
      }
      return true;
    } else {
      return false;
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
        nextCheckTime: Date.now() + Math.ceil(time),
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
    
    const flowPacks = await knex('webgui_flow_pack').where({ accountId: account.id }).whereBetween('createTime', [startTime, endTime]);
    const flowWithFlowPacks = flowPacks.reduce((a, b) => {
      return { flow: a.flow + b.flow };
    }, { flow: data.flow }).flow;
  
    let nextCheckTime = (flowWithFlowPacks - sumFlow) / 200000000 * 60 * 1000 / server.scale;
    if(nextCheckTime >= account.expireTime - Date.now() && account.expireTime - Date.now() > 0) { nextCheckTime = account.expireTime - Date.now() }
    if(nextCheckTime <= 0) { nextCheckTime = 600 * 1000; }
    if(nextCheckTime >= 3 * 60 * 60 * 1000) { nextCheckTime = 3 * 60 * 60 * 1000; }
    await writeFlow(server.id, account.id, realFlow, nextCheckTime);

    return sumFlow >= flowWithFlowPacks;
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
  }).catch();
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
  }).catch();
};

const deleteExtraPorts = async serverInfo => {
  try {
    const currentPorts = await manager.send({ command: 'list' }, {
      host: serverInfo.host,
      port: serverInfo.port,
      password: serverInfo.password,
    });
    const accounts = await knex('account_plugin').where({});
    const accountObj = {};
    accounts.forEach(account => {
      accountObj[account.port] = account;
    });
    for(let p of currentPorts) {
      if(accountObj[p.port - serverInfo.shift]) { continue; }
      await sleep(sleepTime);
      deletePort(serverInfo, { port: p.port - serverInfo.shift });
    }
  } catch(err) {
    console.log(err);
  }
};

const checkAccount = async (serverId, accountId) => {
  try {
    const serverInfo = await knex('server').where({ id: serverId }).then(s => s[0]);
    if(!serverInfo) {
      await knex('account_flow').delete().where({ serverId });
      return;
    }
    const accountInfo = await knex('account_plugin').where({ id: accountId }).then(s => s[0]);
    if(!accountInfo) {
      await knex('account_flow').delete().where({ serverId, accountId });
      return;
    }

    // 检查当前端口是否存在
    const exists = await isPortExists(serverInfo, accountInfo);

    // 检查账号是否激活
    if(!isAccountActive(serverInfo, accountInfo)) {
      exists && deletePort(serverInfo, accountInfo);
      return;
    }

    // 检查账号是否包含该服务器
    if(!hasServer(serverInfo, accountInfo)) {
      await modifyAccountFlow(serverInfo.id, accountInfo.id, 20 * 60 * 1000 + randomInt(30000));
      exists && deletePort(serverInfo, accountInfo);
      return;
    }

    // 检查账号是否过期
    if(isExpired(serverInfo, accountInfo)) {
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

(async () => {
  while(true) {
    const start = Date.now();
    try {
      await sleep(sleepTime);
      const servers = await knex('server').where({});
      for(const server of servers) {
        await sleep(1000);
        await deleteExtraPorts(server);
      }
      await sleep(sleepTime);
      const accounts = await knex('account_plugin').select([
        'account_plugin.id as id'
      ]).crossJoin('server')
      .leftJoin('account_flow', function () {
        this
        .on('account_flow.serverId', 'server.id')
        .on('account_flow.accountId', 'account_plugin.id');
      }).whereNull('account_flow.id');
      for(let account of accounts) {
        await sleep(sleepTime);
        await accountFlow.add(account.id);
      }
      const end = Date.now();
      if(end - start <= 67 * 1000) {
        await sleep(67 * 1000 - (end - start));
      }
    } catch(err) {
      console.log(err);
      const end = Date.now();
      if(end - start <= 67 * 1000) {
        await sleep(67 * 1000 - (end - start));
      }
    }
  }
})();

(async () => {
  while(true) {
    const start = Date.now();
    let accounts = [];
    try {
      const datas = await knex('account_flow').select()
      .where('nextCheckTime', '<', Date.now())
      .orderBy('nextCheckTime', 'asc').limit(600);
      accounts = [...accounts, ...datas];
      if(datas.length < 30) {
        accounts = [...accounts, ...(await knex('account_flow').select()
        .where('nextCheckTime', '>', Date.now())
        .orderBy('nextCheckTime', 'asc').limit(30 - datas.length))];
      }
    } catch(err) { console.log(err); }
    try {
      const datas = await knex('account_flow').select()
      .orderBy('updateTime', 'desc').where('checkTime', '<', Date.now() - 60000).limit(15);
      accounts = [...accounts, ...datas];
    } catch(err) { console.log(err); }
    try {
      datas = await knex('account_flow').select()
      .orderByRaw('rand()').limit(5);
      accounts = [...accounts, ...datas];
    } catch(err) { }
    try {
      datas = await knex('account_flow').select()
      .orderByRaw('random()').limit(5);
      accounts = [...accounts, ...datas];
    } catch(err) { }

    try {
      if(accounts.length <= 120) {
        for(const account of accounts) {
          const start = Date.now();
          await checkAccount(account.serverId, account.accountId).catch();
          const time = 60 * 1000 / accounts.length - (Date.now() - start);
          await sleep((time <= 0 || time > sleepTime) ? sleepTime : time);
        }
      } else {
        await Promise.all(accounts.map((account, index) => {
          return sleep(index * (60 + Math.ceil(accounts.length % 10)) * 1000 / accounts.length).then(() => {
            return checkAccount(account.serverId, account.accountId);
          });
        }));
      }
      if(accounts.length) {
        logger.info(`check ${ accounts.length } accounts, ${ Date.now() - start } ms`);
        if(accounts.length < 30) {
          await sleep((30 - accounts.length) * 1000);
        }
      } else {
        await sleep(30 * 1000);
      }
    } catch (err) {
      const end = Date.now();
      if(end - start <= 60 * 1000) {
        await sleep(60 * 1000 - (end - start));
      }
    }
  }
})();
