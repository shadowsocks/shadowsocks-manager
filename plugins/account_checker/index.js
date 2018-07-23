const knex = appRequire('init/knex').knex;
const cron = appRequire('init/cron');
const flow = appRequire('plugins/flowSaver/flow');
const manager = appRequire('services/manager');
const config = appRequire('services/config').all();
const sleepTime = config.plugins.account_checker.time || 100;

const sleep = time => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), time);
  });
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

    const flows = await Promise.all(servers.map(currentServer => {
      return flow.getFlowFromSplitTime(currentServer.id, account.id, startTime, endTime).then(flow => {
        if(currentServer.id === server.id) { realFlow = flow; }
        return Math.ceil(flow * currentServer.scale);
      });
    }));

    const sumFlow = flows.reduce((a, b) => a + b);
    const nextCheckTime = (data.flow - sumFlow) / 200000000 * 60 * 1000;
    await writeFlow(server.id, account.id, realFlow, nextCheckTime <= 0 ? 600 * 1000 : nextCheckTime);
    return sumFlow >= data.flow;

    // const scale = isMultiServerFlow ? 1 : server.scale;

    // const serverId = isMultiServerFlow ? null : server.id;
    // const currentFlow = await flow.getFlowFromSplitTime(serverId, account.id, startTime, endTime);

    // return currentFlow >= data.flow * scale;
  } else {
    return false;
  }
};

const deletePort = (server, account) => {
  console.log(`del: ${ server.name } ${ account.port }`);
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
  console.log(`add: ${ server.name } ${ account.port }`);
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

const deleteExtraPorts = async serverId => {
  try {
    const serverInfo = await knex('server').where({ id: serverId }).then(s => s[0]);
    if(!serverInfo) { return Promise.reject(`Server[${ serverId }] not exists`); }
    const currentPorts = await manager.send({ command: 'list' }, {
      host: serverInfo.host,
      port: serverInfo.port,
      password: serverInfo.password,
    });
    for(let p of currentPorts) {
      const accountInfo = await knex('account_plugin').where({ port: p.port - serverInfo.shift }).then(s => s[0]);
      if(!accountInfo) {
        deletePort(serverInfo, accountInfo);
      } else if(accountInfo.server && JSON.parse(accountInfo.server).indexOf(serverInfo.id) < 0) {
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
    if(!accountInfo) { return Promise.reject(`Account[${ accountId }] not exists`); }

    // 检查当前端口是否存在
    const exists = await isPortExists(serverInfo, accountInfo);

    // 检查账号是否包含该服务器
    if(!hasServer(serverInfo, accountInfo)) {
      exists && deletePort(serverInfo, accountInfo);
      return;
    }

    // 检查账号是否过期
    if(isExpired(serverInfo, accountInfo)) {
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
    // await sleep(sleepTime);

    // const servers = await knex('server').where({});
    // const accounts = await knex('account_plugin').where({});
    // for(let server of servers) {
    //   // await deleteExtraPorts(server.id);
    //   for(let account of accounts) {
    //     const start = Date.now();
    //     const accountFlowData = await knex('account_flow').where({ serverId: server.id, accountId: account.id }).then(s => s[0]);
    //     if(accountFlowData && Date.now() - accountFlowData.nextCheckTime > 0) {
    //       console.log('continue');
    //       continue;
    //     }
    //     await checkAccount(server.id, account.id);
    //     const end = Date.now();
    //     console.log(`server: ${server.name}, account: ${ account.port }, time: ${ end - start } ms`);
    //     await sleep(sleepTime);
    //   }
    // }

    const servers = await knex('server').where({}).then(s => s.map(m => m.id));
    const accounts = await knex('account_plugin').where({}).then(s => s.map(m => m.id));

    const datas = await knex('account_flow')
    .select([
      'account_flow.id as id',
      'account_flow.serverId as serverId',
      'account_flow.accountId as accountId',
      'account_flow.nextCheckTime as nextCheckTime',
    ])
    .leftJoin('account_plugin', 'account_plugin.id', 'account_flow.accountId')
    .whereIn('account_flow.serverId', servers)
    .whereIn('account_flow.accountId', accounts)
    .where('account_plugin.type', '>', 1)
    .orderBy('account_flow.nextCheckTime', 'asc').limit(30);

    console.log(datas.length);
    for(const data of datas) {
      const start = Date.now();
      const accountFlowData = await knex('account_flow').where({ id: data.id }).then(s => s[0]);
      if(accountFlowData && Date.now() - accountFlowData.nextCheckTime > 0) {
        console.log('continue');
        continue;
      }
      await checkAccount(data.serverId, data.accountId);
      const end = Date.now();
      console.log(`next: ${ accountFlowData.nextCheckTime - Date.now() }, server: ${data.serverId}, account: ${ data.accountId }, time: ${ end - start } ms`);
      await sleep(sleepTime);
    }
  }
})();
