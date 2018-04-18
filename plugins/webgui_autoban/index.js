const log4js = require('log4js');
const logger = log4js.getLogger('autoban');
const cron = appRequire('init/cron');
const knex = appRequire('init/knex').knex;
const config = appRequire('services/config').all();
const banConfig = config.plugins.webgui_autoban.data;

const queue = [];

const convertTimeString = str => {
  if(!str.match) { return str; }
  if(str.match(/^(\d{1,}.{0,1}\d{0,})[sS]$/)) {
    return +str.match(/^(\d{1,}.{0,1}\d{0,})[sS]$/)[1] * 1000;
  }
  if(str.match(/^(\d{1,}.{0,1}\d{0,})[mM]$/)) {
    return +str.match(/^(\d{1,}.{0,1}\d{0,})[mM]$/)[1] * 60 * 1000;
  }
  if(str.match(/^(\d{1,}.{0,1}\d{0,})[hH]$/)) {
    return +str.match(/^(\d{1,}.{0,1}\d{0,})[hH]$/)[1] * 60 * 60 * 1000;
  }
};

const convertFlowString = str => {
  if(!str.match) { return str; }
  if(str.match(/^(\d{1,}.{0,1}\d{0,})[kK]$/)) {
    return +str.match(/^(\d{1,}.{0,1}\d{0,})[kK]$/)[1] * 1000;
  }
  if(str.match(/^(\d{1,}.{0,1}\d{0,})[mM]$/)) {
    return +str.match(/^(\d{1,}.{0,1}\d{0,})[mM]$/)[1] * 1000 * 1000;
  }
  if(str.match(/^(\d{1,}.{0,1}\d{0,})[hH]$/)) {
    return +str.match(/^(\d{1,}.{0,1}\d{0,})[gG]$/)[1] * 1000 * 1000 * 1000;
  }
};

banConfig.forEach(f => {
  const accountIds = [];
  const serverIds = [];
  f.accountId.split(',').forEach(ports => {
    if(ports.indexOf('-') < 0) {
      accountIds.push(+ports);
    } else {
      const start = +ports.split('-')[0];
      const end = +ports.split('-')[1];
      for(let i = start; i <= end; i++) {
        accountIds.push(i);
      }
    }
  });
  f.serverId.split(',').forEach(ids => {
    if(ids.indexOf('-') < 0) {
      serverIds.push(+ids);
    } else {
      const start = +ids.split('-')[0];
      const end = +ids.split('-')[1];
      for(let i = start; i <= end; i++) {
        serverIds.push(i);
      }
    }
  });
  const time = convertTimeString(f.time);
  const flow = convertFlowString(f.flow);
  const banTime = convertTimeString(f.banTime);
  serverIds.forEach(serverId => {
    accountIds.forEach(accountId => {
      queue.push({
        serverId, accountId, time, flow, banTime,
      });
    });
  });
});

const ban = async (serverId, accountId, time) => {
  logger.info('ban [' + serverId + '][' + accountId + ']');
  await knex('account_flow').update({
    status: 'ban',
    nextCheckTime: Date.now() + time,
    autobanTime: Date.now() + time,
  }).where({
    serverId, accountId,
  });
};

const check = async opt => {
  const start = Date.now();
  const { serverId, accountId, time, flow, banTime } = opt;
  const accountFlowData = await knex('account_flow').where({
    serverId, accountId,
  }).then(s => s[0]);
  if(!accountFlowData) { return 'not exists'; }
  let checkTime;
  if(accountFlowData && accountFlowData.autobanTime >= Date.now() - time) {
    checkTime = accountFlowData.autobanTime;
  } else {
    checkTime = Date.now() - time;
  }
  const myFlow = await knex('saveFlow')
  .sum('flow as sumFlow')
  .where({
    id: serverId,
    accountId,
  }).where('time', '>', checkTime).then(s => s[0]);
  if(myFlow.sumFlow >= flow) {
    await ban(serverId, accountId, banTime);
  }
};

let position = 0;

const promise = () => {
  const speed = config.plugins.webgui_autoban.speed || 1000;
  return check(queue[position]).then(success => {
    position += 1;
    if(queue.length <= position) { position = 0; }
    if(success === 'not exists') {
      return promise();
    } else {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          return promise(resolve, reject);
        }, speed);
      });
    }
  });
};

promise();