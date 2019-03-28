const log4js = require('log4js');
const logger = log4js.getLogger('account');
const cluster = require('cluster');
const process = require('process');
const redis = appRequire('init/redis').redis;
const knex = appRequire('init/knex').knex;
const cron = appRequire('init/cron');
const flow = appRequire('plugins/flowSaver/flow');
const manager = appRequire('services/manager');
const config = appRequire('services/config').all();
let acConfig = {};
if(config.plugins.account_checker && config.plugins.account_checker.use) {
  acConfig = config.plugins.account_checker;
}
const speed = acConfig.speed || 5;
const sleepTime = 100;
const accountFlow = appRequire('plugins/account/accountFlow');

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

const randomInt = max => {
  return Math.ceil(Math.random() * max % max);
};

const modifyAccountFlow = async (serverId, accountId, nextCheckTime) => {
  await knex('account_flow').update({
    checkTime: Date.now(),
    nextCheckTime,
  }).where({ serverId, accountId });
};

const portList = {};
const updatePorts = async server => {
  if(!portList[server.id] || Date.now() - portList[server.id].update >= 35 * 1000) {
    const ports = (await manager.send({ command: 'list' }, {
      host: server.host,
      port: server.port,
      password: server.password,
    })).map(m => m.port);
    portList[server.id] = {
      ports,
      update: Date.now(),
    };
  }
  return portList[server.id].ports;
};

const isPortExists = async (server, account) => {
  // const ports = (await manager.send({ command: 'list' }, {
  //   host: server.host,
  //   port: server.port,
  //   password: server.password,
  // })).map(m => m.port);
  const ports = await updatePorts(server);
  if(ports.includes(server.shift + account.port)) {
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
  modifyAccountFlow(server.id, account.id, Date.now() + randomInt(7 * 24 * 3600 * 1000));
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
    let nextCheckTime = data.create;
    while(nextCheckTime <= Date.now()) {
      nextCheckTime += timePeriod;
    }
    if(expireTime <= Date.now() || data.create >= Date.now()) {
      if(account.active && account.autoRemove && expireTime + account.autoRemoveDelay < Date.now()) {
        knex('account_plugin').delete().where({ id: account.id }).then();
      } else if(account.active && account.autoRemove && expireTime + account.autoRemoveDelay >= Date.now()) {
        modifyAccountFlow(server.id, account.id, expireTime + account.autoRemoveDelay);
      } else if(account.active && !account.autoRemove) {
        modifyAccountFlow(server.id, account.id, Date.now() + randomInt(7 * 24 * 3600 * 1000));
      }
      return true;
    } else {
      modifyAccountFlow(server.id, account.id, nextCheckTime);
      return false;
    }
  } else {
    modifyAccountFlow(server.id, account.id, Date.now() + 24 * 3600 * 1000);
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
  const writeFlow = async (serverId, accountId, flow) => {
    const exists = await knex('account_flow').where({ serverId, accountId }).then(s => s[0]);
    if(exists) {
      await knex('account_flow').update({
        flow,
        checkTime: Date.now(),
        checkFlowTime: Date.now(),
      }).where({ id: exists.id });
    }
  };
  const writeFlowForOtherServer = async (serverId, accountId) => {
    await knex('account_flow').update({
      checkFlowTime: Date.now(),
    }).where({
      accountId
    })
    .whereNotIn('serverId', [ serverId ])
    .where('flow', '>', 0);
  };
  const checkFlowForOtherServer = async (serverId, accountId) => {
    await knex('account_flow').update({
      nextCheckTime: Date.now(),
    }).where({
      accountId
    }).whereNotIn('serverId', [ serverId ]);
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
    await writeFlow(server.id, account.id, realFlow);
    if(account.multiServerFlow && sumFlow < flowWithFlowPacks) {
      await writeFlowForOtherServer(server.id, account.id);
    }
    if(account.multiServerFlow && sumFlow >= flowWithFlowPacks) {
      await checkFlowForOtherServer(server.id, account.id);
    }
    return sumFlow >= flowWithFlowPacks;
  } else {
    await writeFlow(server.id, account.id, 0);
    return false;
  }
};

const deletePort = async (server, account) => {
  // console.log(`del ${ server.name } ${ account.port }`);
  const portNumber = server.shift + account.port;
  await manager.send({
    command: 'del',
    port: portNumber,
  }, {
    host: server.host,
    port: server.port,
    password: server.password,
  }).catch();
};

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

const generateAccountKey = async account => {
  const privateKey = await runCommand('wg genkey');
  const publicKey = await runCommand(`echo '${ privateKey.trim() }' | wg pubkey`);
  await knex('account_plugin').update({
    key: publicKey.trim() + ':' + privateKey.trim(),
  }).where({ id: account.id });
  return publicKey.trim();
};

const addPort = async (server, account) => {
  // console.log(`add ${ server.name } ${ account.port }`);
  if(server.type === 'WireGuard') {
    let publicKey = account.key;
    if(!publicKey) {
      publicKey = await generateAccountKey(account);
    }
    if(publicKey.includes(':')) {
      publicKey = publicKey.split(':')[0];
    }
    const portNumber = server.shift + account.port;
    await manager.send({
      command: 'add',
      port: portNumber,
      password: publicKey,
    }, {
      host: server.host,
      port: server.port,
      password: server.password,
    }).catch();
    
  } else {
    const portNumber = server.shift + account.port;
    await manager.send({
      command: 'add',
      port: portNumber,
      password: account.password,
    }, {
      host: server.host,
      port: server.port,
      password: server.password,
    }).catch();
  }
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
    for(const p of currentPorts) {
      if(accountObj[p.port - serverInfo.shift]) { continue; }
      await sleep(sleepTime);
      await deletePort(serverInfo, { port: p.port - serverInfo.shift });
    }
  } catch(err) {
    logger.error(err);
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
      exists && await deletePort(serverInfo, accountInfo);
      return;
    }

    // 检查账号是否包含该服务器
    if(!hasServer(serverInfo, accountInfo)) {
      // await modifyAccountFlow(serverInfo.id, accountInfo.id, 20 * 60 * 1000 + randomInt(30000));
      exists && await deletePort(serverInfo, accountInfo);
      return;
    }

    // 检查账号是否过期
    if(isExpired(serverInfo, accountInfo)) {
      exists && await deletePort(serverInfo, accountInfo);
      return;
    }

    // 检查账号是否被ban
    if(await isBaned(serverInfo, accountInfo)) {
      exists && await deletePort(serverInfo, accountInfo);
      return;
    }

    // 检查账号是否超流量
    if(await isOverFlow(serverInfo, accountInfo)) {
      exists && await deletePort(serverInfo, accountInfo);
      return;
    }

    !exists && await addPort(serverInfo, accountInfo);
  } catch(err) {
    logger.error(err);
  }
};

let time = 120;
cron.loop(
  async() => {
    const start = Date.now();
    try {
      await sleep(sleepTime);
      const servers = await knex('server').where({});
      const totalAccounts = await knex('account_plugin').select([ 'id' ]);
      for(const server of servers) {
        await sleep(1000);
        await deleteExtraPorts(server);
      }
      await sleep(sleepTime);
      if(servers.length * totalAccounts.length > 1000) {
        const ids = await knex('account_flow')
        .select(['id'])
        .orderBy('id', 'ASC')
        .limit(Math.ceil(servers.length * totalAccounts.length / 1000));
        await knex('account_flow').delete()
        .whereIn('id', ids.map(m => m.id));
      }

      const accounts = await knex('account_plugin').select([
        'account_plugin.id as id',
      ])
      .count('account_flow.serverId as count')
      .leftOuterJoin('account_flow', 'account_flow.accountId', 'account_plugin.id')
      .groupBy('account_plugin.id')
      .having('count', '<', servers.length);

      // const accounts = await knex('account_plugin').select([
      //   'account_plugin.id as id',
      // ]).crossJoin('server')
      // .leftJoin('account_flow', function () {
      //   this
      //   .on('account_flow.serverId', 'server.id')
      //   .on('account_flow.accountId', 'account_plugin.id');
      // }).whereNull('account_flow.id');
      for(const account of accounts) {
        await sleep(sleepTime);
        await accountFlow.add(account.id);
      }
      const end = Date.now();
      if(end - start <= time * 1000) {
        await sleep(time * 1000 - (end - start));
      }
      if(time <= 600) { time += 10; }
    } catch(err) {
      logger.error(err);
      const end = Date.now();
      if(end - start <= time * 1000) {
        await sleep(time * 1000 - (end - start));
      }
    }
  },
  'AccountCheckerDeleteExtraPorts',
  360,
);

cron.minute(async () => {
  await knex('account_flow').delete()
  .where('nextCheckTime', '<', Date.now() - 3 * 60 * 60 * 1000)
  .orderBy('nextCheckTime', 'asc');
}, 'DeleteInvalidAccountFlow', 30);

(async () => {
  const serverNumber = await knex('server').select(['id']).then(s => s.length);
  const accountNumber = await knex('account_plugin').select(['id']).then(s => s.length);
  if(serverNumber * accountNumber > 300) {
    while(true) {
      try {
        const accountLeft = await redis.lpop('CheckAccount:Queue');
        const accountRight = await redis.rpop('CheckAccount:Queue');
        const queueLength = await redis.llen('CheckAccount:Queue');
        if(!accountLeft || queueLength < 10) {
          const mark = await redis.setnx('CheckAccount:Mark', 1);
          if(mark) {
            redis.expire('CheckAccount:Mark', 5);
            let accounts = [];
            try {
              const datas = await knex('account_flow').select()
              .where('nextCheckTime', '<', Date.now())
              .orderBy('nextCheckTime', 'desc')
              // .limit(200)
              .offset(0);
              accounts = [...accounts, ...datas];
            } catch(err) {
              logger.error(err);
            }
            try {
              const datas = await knex('account_flow').select()
              .where('updateTime', '>', Date.now() - 8 * 60 * 1000)
              .where('checkFlowTime', '<', Date.now() - 10 * 60 * 1000)
              .whereNotIn('id', accounts.map(account => account.id))
              .orderBy('updateTime', 'desc')
              .limit(50)
              .offset(0);
              accounts = [...accounts, ...datas];
            } catch(err) { logger.error(err); }
            try {
              datas = await knex('account_flow').select()
              .whereNotIn('id', accounts.map(account => account.id))
              .orderByRaw('rand()').limit(accounts.length < 30 ? 35 - accounts.length : 5);
              accounts = [...accounts, ...datas];
            } catch(err) { }
            try {
              datas = await knex('account_flow').select()
              .whereNotIn('id', accounts.map(account => account.id))
              .orderByRaw('random()').limit(accounts.length < 30 ? 35 - accounts.length : 5);
              accounts = [...accounts, ...datas];
            } catch(err) { }
            if(accounts.length) {
              logger.info(`Add [${ accounts.length }] elements to queue`);
              await redis.lpush('CheckAccount:Queue', accounts.map(m => `${ m.serverId }:${ m.accountId }`));
            }
            redis.del('CheckAccount:Mark');
            await sleep(5000);
          };
        }
        if(accountLeft) {
          const serverId = +accountLeft.split(':')[0];
          const accountId = +accountLeft.split(':')[1];
          const start = Date.now();
          await checkAccount(serverId, accountId).catch(err => {});
          if(Date.now() - start < (1000 / speed)) {
            await sleep(1000 / speed - (Date.now() - start));
          }
        }
        if(accountRight) {
          const serverId = +accountRight.split(':')[0];
          const accountId = +accountRight.split(':')[1];
          const start = Date.now();
          await checkAccount(serverId, accountId).catch(err => {});
          if(Date.now() - start < (1000 / speed)) {
            await sleep(1000 / speed - (Date.now() - start));
          }
        }
      }
      catch(err) {
        logger.error(err);
        await sleep(5000);
      }
    }
  } else {
    while(true) {
      await sleep(randomInt(2000));
      const start = Date.now();
      let accounts = [];
      const redis = appRequire('init/redis').redis;
      const keys = await redis.keys('CheckAccount:*');
      const ids = keys.length === 0 ? [] : (await redis.mget(keys)).map(m => JSON.parse(m)).reduce((a, b) => {
        return b ? [...a, ...b] : a;
      }, []);
      try {
        const datas = await knex('account_flow').select()
        .where('nextCheckTime', '<', Date.now())
        .whereNotIn('id', ids)
        .orderBy('nextCheckTime', 'asc')
        .limit(400)
        .offset(0);
        accounts = [...accounts, ...datas];
      } catch(err) { logger.error(err); }
      try {
        const datas = await knex('account_flow').select()
        .whereNotIn('id', ids)
        .whereNotIn('id', accounts.map(account => account.id))
        .where('updateTime', '>', Date.now() - 8 * 60 * 1000)
        .where('checkFlowTime', '<', Date.now() - 10 * 60 * 1000)
        .orderBy('updateTime', 'desc')
        .limit(400)
        .offset(0);
        accounts = [...accounts, ...datas];
      } catch(err) { logger.error(err); }
      try {
        datas = await knex('account_flow').select()
        .whereNotIn('id', ids)
        .whereNotIn('id', accounts.map(account => account.id))
        .orderByRaw('rand()').limit(accounts.length < 30 ? 35 - accounts.length : 5);
        accounts = [...accounts, ...datas];
      } catch(err) { }
      try {
        datas = await knex('account_flow').select()
        .whereNotIn('id', ids)
        .whereNotIn('id', accounts.map(account => account.id))
        .orderByRaw('random()').limit(accounts.length < 30 ? 35 - accounts.length : 5);
        accounts = [...accounts, ...datas];
      } catch(err) { }

      try {
        if(accounts.length <= 120) {
          for(const account of accounts) {
            const start = Date.now();
            await checkAccount(account.serverId, account.accountId).catch(err => {});
            const time = 60 * 1000 / accounts.length - (Date.now() - start);
            await sleep((time <= 0 || time > sleepTime) ? sleepTime : time);
          }
        } else {
          await Promise.all(accounts.map((account, index) => {
            return sleep(index * (60 + Math.ceil(accounts.length % 10)) * 1000 / accounts.length).then(() => {
              return checkAccount(account.serverId, account.accountId).catch(err => {});
            });
          }));
        }
        if(accounts.length) {
          await redis.set(`CheckAccount:${ process.uptime() }:${ cluster.worker.id }`, JSON.stringify(accounts.map(account => account.id)), 'EX', 45);
          logger.info(`check ${ accounts.length } accounts, ${ Date.now() - start } ms`);
          if(accounts.length < 30) {
            await sleep((30 - accounts.length) * 1000);
          }
        } else {
          logger.info('no need to check');
          await sleep(30 * 1000);
        }
      } catch (err) {
        const end = Date.now();
        if(end - start <= 60 * 1000) {
          await sleep(60 * 1000 - (end - start));
        }
      }
    }
  }
})();

