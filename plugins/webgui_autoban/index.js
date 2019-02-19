const log4js = require('log4js');
const moment = require('moment');
const logger = log4js.getLogger('autoban');
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
    nextCheckTime: Date.now(),
    autobanTime: Date.now() + time,
  }).where({
    serverId, accountId,
  });
};

const splitTime = async (start, end) => {
  
  const time = {
    day: [],
    hour: [],
    fiveMin: [],
    origin: [],
  };
  const now = Date.now();
  const getMinute = moment(now).get('minute');
  const splitEnd = {
    day: moment(now).hour(0).minute(0).second(0).millisecond(0).toDate().getTime(),
    hour: moment(now).minute(0).second(0).millisecond(0).toDate().getTime(),
    fiveMin: moment(now).minute(getMinute - getMinute%5).second(0).millisecond(0).toDate().getTime(),
  };
  const isDay = time => {
    const hour = moment(time).get('hour');
    const minute = moment(time).get('minute');
    const second = moment(time).get('second');
    const millisecond = moment(time).get('millisecond');
    if(hour || minute || second || millisecond) {
      return false;
    }
    return true;
  };
  const isHour = time => {
    const minute = moment(time).get('minute');
    const second = moment(time).get('second');
    const millisecond = moment(time).get('millisecond');
    if(minute || second || millisecond) {
      return false;
    }
    return true;
  };
  const is5min = time => {
    const minute = moment(time).get('minute');
    const second = moment(time).get('second');
    const millisecond = moment(time).get('millisecond');
    if(minute%5 || second || millisecond) {
      return false;
    }
    return true;
  };
  const next = (time, type) => {
    if(type === 'day') {
      return moment(time).add(1, 'days').hour(0).minute(0).second(0).millisecond(0).toDate().getTime();
    }
    if(type === 'hour') {
      return moment(time).add(1, 'hours').minute(0).second(0).millisecond(0).toDate().getTime();
    }
    if(type === '5min') {
      const getMinute = moment(time).get('minute');
      return moment(time).minute(getMinute - getMinute%5).add(5, 'minutes').second(0).millisecond(0).toDate().getTime();
    }
  };
  let timeStart = start;
  let timeEnd = end;
  let last;
  while(timeStart < timeEnd) {
    if(isDay(timeStart) && next(timeStart, 'day') <= splitEnd.day && next(timeStart, 'day') <= end) {
      if(last === 'day' && time.day.length) {
        const length = time.day.length;
        time.day[length - 1] = [
          time.day[length - 1][0],
          next(timeStart, 'day')
        ];
      } else {
        time.day.push([timeStart, next(timeStart, 'day')]);
      }
      timeStart = next(timeStart, 'day');
      last = 'day';
    } else if(isHour(timeStart) && next(timeStart, 'hour') <= splitEnd.hour && next(timeStart, 'hour') <= end) {
      if(last === 'hour' && time.hour.length) {
        const length = time.hour.length;
        time.hour[length - 1] = [
          time.hour[length - 1][0],
          next(timeStart, 'hour')
        ];
      } else {
        time.hour.push([timeStart, next(timeStart, 'hour')]);
      }
      timeStart = next(timeStart, 'hour');
      last = 'hour';
    } else if(is5min(timeStart) && next(timeStart, '5min') <= splitEnd.fiveMin && next(timeStart, '5min') <= end) {
      if(last === '5min' && time.fiveMin.length) {
        const length = time.fiveMin.length;
        time.fiveMin[length - 1] = [
          time.fiveMin[length - 1][0],
          next(timeStart, '5min')
        ];
      } else {
        time.fiveMin.push([timeStart, next(timeStart, '5min')]);
      }
      timeStart = next(timeStart, '5min');
      last = '5min';
    } else if(next(timeStart, '5min') <= end && timeStart === start) {
      time.origin.push([timeStart, next(timeStart, '5min')]);
      timeStart = next(timeStart, '5min');
      last = '5min';
    } else {
      time.origin.push([timeStart, timeEnd]);
      timeStart = timeEnd;
      last = 'origin';
    }
  }
  return time;
};

const getFlowFromSplitTime = async (serverId, accountId, start, end) => {
  const time = await splitTime(start, end);
  const sum = [];
  const getFlow = (tableName, startTime, endTime) => {
    return knex(tableName)
    .sum('flow as sumFlow')
    .groupBy('id')
    .select(['id'])
    .where({
      id: serverId,
      accountId,
    })
    .whereBetween('time', [startTime, endTime - 1]).then(success => {
      if(success[0]) { return success[0].sumFlow; }
      return 0;
    });
  };
  time.day.forEach(f => {
    sum.push(getFlow('saveFlowDay', f[0], f[1]));
  });
  time.hour.forEach(f => {
    sum.push(getFlow('saveFlowHour', f[0], f[1]));
  });
  time.fiveMin.forEach(f => {
    sum.push(getFlow('saveFlow5min', f[0], f[1]));
  });
  time.origin.forEach(f => {
    sum.push(getFlow('saveFlow', f[0], f[1]));
  });
  const result = (await Promise.all(sum)).reduce((a, b) => a + b);
  return result;
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
  // const lastConnect = await knex('saveFlow5min')
  // .select(['time'])
  // .where({ id: serverId, accountId })
  // .orderBy('time', 'desc')
  // .limit(1).then(success => {
  //   if(success[0]) {
  //     return success[0].time;
  //   }
  //   return 0;
  // });
  // if(!lastConnect || lastConnect <= checkTime) { logger.info('no need to check');  return; }
  const myFlow = await getFlowFromSplitTime(serverId, accountId, checkTime, Date.now());
  if(myFlow >= flow) {
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
