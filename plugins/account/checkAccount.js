const log4js = require('log4js');
const logger = log4js.getLogger('account');
const knex = appRequire('init/knex').knex;
const serverManager = appRequire('plugins/flowSaver/server');
const flow = appRequire('plugins/flowSaver/flow');
const flowSaver = appRequire('plugins/flowSaver/flow');
const manager = appRequire('services/manager');
const moment = require('moment');
const cron = appRequire('init/cron');
let messages = [];

const sendMessage = () => {
  if(!messages.length) {
    return;
  }
  messages.forEach(message => {
    manager.send(message[0], message[1]).then().catch();
  });
  messages = [];
};

cron.second(() => {
  sendMessage();
}, 10);

const addPort = (data, server) => {
  messages.push([{
    command: 'add',
    port: data.port + server.shift,
    password: data.password,
  }, {
    host: server.host,
    port: server.port,
    password: server.password,
  }]);
};

const delPort = (data, server) => {
  messages.push([{
    command: 'del',
    port: data.port + server.shift,
  }, {
    host: server.host,
    port: server.port,
    password: server.password,
  }]);
};

const changePassword = async (id, password) => {
  const server = await serverManager.list();
  const account = await knex('account_plugin').select();
  const port = account.filter(f => f.id === id)[0].port;
  if(!port) { return Promise.reject('account id not exists'); }
  server.forEach(s => {
    messages.push([{
      command: 'pwd',
      port: port + s.shift,
      password,
    }, {
      host: s.host,
      port: s.port,
      password: s.password,
    }]);
  });
  return;
};

const getAccountFlow = async (serverId, accountId) => {
  const exists = await knex('account_flow').where({
    serverId,
    accountId,
  }).then(success => success[0]);
  return exists;
};

const setAccountFlow = async (serverId, accountId, flow, port, nextCheckTime) => {
  const exists = await knex('account_flow').where({
    serverId,
    accountId,
  }).then(success => success[0]);
  if(!exists) {
    await knex('account_flow').insert({
      serverId,
      accountId,
      port,
      flow,
      checkTime: Date.now(),
      nextCheckTime,
    });
  } else {
    await knex('account_flow').update({
      port,
      flow,
      checkTime: Date.now(),
      nextCheckTime,
    }).where({
      serverId,
      accountId,
    });
  }
};

const checkFlow = async (server, accountId, startTime, endTime) => {
  let isMultiServerFlow = false;
  try {
    const accountInfo = await knex('account_plugin').where({ id: accountId }).then(s => s[0]);
    isMultiServerFlow = !!accountInfo.multiServerFlow;
  } catch (err) {}
  const serverId = isMultiServerFlow ? null : server;
  const userFlow = await flow.getFlowFromSplitTime(serverId, accountId, startTime, endTime);
  return userFlow;
};

const checkFlowFromAccountFlowTable = async (serverId, accountId) => {
  const where = { accountId };
  if(serverId) { where.serverId = serverId; }
  const result = await knex('account_flow').sum('flow as sumFlow').groupBy('accountId').where(where).then(s => s[0]);
  return result ? result.sumFlow : -1;
};

const deleteCheckAccountTimePort = async port => {
  const servers = await knex('server').select();
  servers.forEach(async server => {
    await knex('account_flow').update({
      nextCheckTime: Date.now(),
    }).where({
      serverId: server.id,
      port: port + server.shift,
    });
  });
  return;
};
const deleteCheckAccountTimeServer = serverId => {
  return knex('account_flow').update({
    nextCheckTime: Date.now(),
  }).where({ serverId });
};

const sleep = time => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), time);
  });
};

let lastCheck = 0;
const checkServer = async () => {
  if(!lastCheck) {
    lastCheck = Date.now();
  } else if(Date.now() - lastCheck <= 29 * 1000) {
    return;
  }
  lastCheck = Date.now();
  logger.info('check account');
  const account = await knex('account_plugin').select();
  account.forEach(a => {
    if(a.type >= 2 && a.type <= 5) {
      let timePeriod = 0;
      if(a.type === 2) { timePeriod = 7 * 86400 * 1000; }
      if(a.type === 3) { timePeriod = 30 * 86400 * 1000; }
      if(a.type === 4) { timePeriod = 1 * 86400 * 1000; }
      if(a.type === 5) { timePeriod = 3600 * 1000; }
      const data = JSON.parse(a.data);
      let startTime = data.create;
      while(startTime + timePeriod <= Date.now()) {
        startTime += timePeriod;
      }
      if(data.create + data.limit * timePeriod <= Date.now() || data.create >= Date.now()) {
        if(a.autoRemove) {
          knex('account_plugin').delete().where({ id: a.id }).then();
        }
      }
    }
  });
  const server = await serverManager.list();
  account.exist = (number, server) => {
    return !!account.filter(f => {
      return f.port + server.shift === number;
    })[0];
  };
  const promises = [];
  server.forEach(s => {
    const checkServerAccount = async s => {
      try {
        await sleep(Math.ceil(Math.random() * 45000));
        const port = await manager.send({ command: 'list' }, {
          host: s.host,
          port: s.port,
          password: s.password,
        });
        port.list = {};
        port.forEach(f => {
          port.list[f.port] = true;
        });
        port.exist = number => {
          return !!port.list[number + s.shift];
        };
        const checkAccountStatus = async a => {
          const sleepTime = Math.ceil(Math.random() * 120000);
          await sleep(sleepTime);
          const isMultiServerFlow = !!a.multiServerFlow;
          const accountServer = a.server ? JSON.parse(a.server) : a.server;
          if(accountServer) {
            const newAccountServer = accountServer.filter(f => {
              return server.filter(sf => sf.id === f)[0];
            });
            if(JSON.stringify(newAccountServer) !== JSON.stringify(accountServer)) {
              await knex('account_plugin').update({
                server: JSON.stringify(newAccountServer),
              }).where({
                port: a.port,
              });
            }
          }
          if(accountServer && accountServer.indexOf(s.id) < 0) {
            port.exist(a.port) && delPort(a, s);
            return 0;
          }
          let accountFlowData = await getAccountFlow(s.id, a.id);
          if(!accountFlowData) {
            await setAccountFlow(s.id, a.id, 0, a.port + s.shift, Date.now());
            accountFlowData = await getAccountFlow(s.id, a.id);
            return 0;
          }
          if(accountFlowData.status === 'ban' && Date.now() <= accountFlowData.nextCheckTime) {
            port.exist(a.port) && delPort(a, s);
            return 0;
          } else if (accountFlowData.status === 'ban' && Date.now() > accountFlowData.nextCheckTime) {
            await knex('account_flow').update({ status: 'checked' }).where({
              serverId: s.id, accountId: a.id,
            });
          } else if(a.type >= 2 && a.type <= 5) {
            let timePeriod = 0;
            if(a.type === 2) { timePeriod = 7 * 86400 * 1000; }
            if(a.type === 3) { timePeriod = 30 * 86400 * 1000; }
            if(a.type === 4) { timePeriod = 1 * 86400 * 1000; }
            if(a.type === 5) { timePeriod = 3600 * 1000; }
            const data = JSON.parse(a.data);
            let startTime = data.create;
            while(startTime + timePeriod <= Date.now()) {
              startTime += timePeriod;
            }
            let flow = -1;
            let flow2 = -1;
            if(!accountFlowData || (accountFlowData && Date.now() >= accountFlowData.nextCheckTime)) {
              flow = await checkFlow(s.id, a.id, startTime, Date.now());
              const nextTime = (data.flow * (isMultiServerFlow ? 1 : s.scale) - flow) / 200000000 * 60 * 1000;
              let nextCheckTime;
              if(!accountFlowData) {
                nextCheckTime = Date.now() + 150 * 1000;
              } else if(nextTime <= 0) {
                nextCheckTime = Date.now() + 10 * 60 * 1000;
              } else {
                nextCheckTime = Date.now() + nextTime;
              }
              await setAccountFlow(
                s.id, a.id,
                isMultiServerFlow ? await flowSaver.getFlowFromSplitTime(s.id, a.id, startTime, Date.now()) : flow,
                a.port + s.shift, nextCheckTime
              );
            }
            if(flow === -1 && accountFlowData.updateTime && Date.now() - 15 * 60 * 1000 >= accountFlowData.checkTime) {
              flow2 = await checkFlowFromAccountFlowTable(isMultiServerFlow ? null : s.id, a.id);
              const nextTime = (data.flow * (isMultiServerFlow ? 1 : s.scale) - flow2) / 200000000 * 60 * 1000;
              let nextCheckTime;
              if(!accountFlowData) {
                nextCheckTime = Date.now() + 150 * 1000;
              } else if(nextTime <= 0) {
                nextCheckTime = Date.now() + 10 * 60 * 1000;
              } else {
                nextCheckTime = Date.now() + nextTime;
              }
              // if(flow2 > -1) {
              //   await setAccountFlow(
              //     s.id, a.id,
              //     isMultiServerFlow ? await checkFlowFromAccountFlowTable(s.id, a.id) : flow2,
              //     a.port + s.shift, nextCheckTime
              //   );
              // }
            }
            if(flow >= 0 && isMultiServerFlow && flow >= data.flow) {
              port.exist(a.port) && delPort(a, s);
              return 1;
            } else if (flow >= 0 && !isMultiServerFlow && flow >= data.flow * s.scale) {
              port.exist(a.port) && delPort(a, s);
              return 1;
            } else if (flow2 >= 0 && isMultiServerFlow && flow2 >= data.flow) {
              port.exist(a.port) && delPort(a, s);
              return 0;
            } else if (flow2 >= 0 && !isMultiServerFlow && flow2 >= data.flow * s.scale) {
              port.exist(a.port) && delPort(a, s);
              return 0;
            } else if(data.create + data.limit * timePeriod <= Date.now() || data.create >= Date.now()) {
              port.exist(a.port) && delPort(a, s);
              return 0;
            } else if(!port.exist(a.port) && (flow >= 0 || flow2 >= 0)) {
              addPort(a, s);
              return 0;
            } else {
              return flow >= 0 ? 1 : 0;
            }
          } else if (a.type === 1) {
            if(port.exist(a.port)) {
              return 0;
            }
            addPort(a, s);
            return 0;
          } else {
            return 0;
          }
        };
        const checkAccountStatusPromises = [];
        account.forEach(a => {
          checkAccountStatusPromises.push(checkAccountStatus(a));
        });
        const checkFlowNumber = await Promise.all(checkAccountStatusPromises)
        .then(success => {
          if(!success.length) { return 0; }
          const checkFlowNumber = success.reduce((a, b) => {
            return a + b;
          });
          logger.info(`check account flow [${ s.name }] ${ checkFlowNumber }`);
          return checkFlowNumber;
        });
        port.forEach(async p => {
          if(!account.exist(p.port, s)) {
            delPort({
              port: p.port - s.shift
            }, s);
          }
        });
        return checkFlowNumber;
      } catch (err) {
        logger.error(err);
        return 0;
      }
    };
    promises.push(checkServerAccount(s));
  });
  Promise.all(promises).then(success => {
    const sum = success.reduce((a, b) => a + b);
    let deleteCount = 0;
    if(sum <= 10) {
      deleteCount = 30;
    } else if(sum > 10 && sum <= 50) {
      deleteCount = 15;
    } else if(sum > 50) {
      deleteCount = 5;
    }
    knex('account_flow').select(['id']).orderBy('id').limit(deleteCount).then(success => {
      return knex('account_flow').update({ nextCheckTime: Date.now() }).whereIn('id', success.map(m => m.id));
    });
    knex('account_flow')
    .select([
      'account_flow.id as id',
      'server.id as serverId',
      'account_plugin.id as accountId',
    ])
    .leftOuterJoin('account_plugin', 'account_flow.accountId', 'account_plugin.id')
    .leftOuterJoin('server', 'account_flow.serverId', 'server.id')
    .whereNull('account_plugin.id')
    .orWhereNull('server.id')
    .then(success => {
      return knex('account_flow').delete().whereIn('id', success.map(m => m.id));
    });
  });
};

exports.checkServer = checkServer;
exports.sendMessage = sendMessage;
exports.addPort = addPort;
exports.delPort = delPort;
exports.changePassword = changePassword;
exports.deleteCheckAccountTimePort = deleteCheckAccountTimePort;
exports.deleteCheckAccountTimeServer = deleteCheckAccountTimeServer;

// setTimeout(() => {
//   checkServer();
// }, 8 * 1000);
cron.minute(() => {
  checkServer();
}, 2);