const knex = appRequire('init/knex').knex;
const config = appRequire('services/config').all();
const moment = require('moment');
/*
arguments: startTime, endTime
  or
arguments: id, startTime, endTime
  or
arguments: host, port, startTime, endTime
 */
const getFlow = function () {
  if(arguments[3]) {
    const host = arguments[0];
    const port = arguments[1];
    const startTime = arguments[2];
    const endTime = arguments[3];
    return knex('saveFlow').innerJoin('server', 'server.id', 'saveFlow.id')
    .sum('flow as sumFlow')
    .groupBy('saveFlow.port')
    .select(['saveFlow.port as port'])
    .where({
      'server.host': host,
      'server.port': port,
    })
    .whereBetween('time', [startTime, endTime]);
  } else if (arguments[2]) {
    const id = arguments[0];
    const startTime = arguments[1];
    const endTime = arguments[2];
    return knex('saveFlow')
    .sum('flow as sumFlow')
    .groupBy('port')
    .select(['port'])
    .where({id})
    .whereBetween('time', [startTime, endTime]);
  } else {
    const host = config.manager.address.split(':')[0];
    const port = +config.manager.address.split(':')[1];
    const startTime = arguments[0];
    const endTime = arguments[1];
    return knex('saveFlow').innerJoin('server', 'server.id', 'saveFlow.id')
    .sum('flow as sumFlow')
    .groupBy('saveFlow.port')
    .select(['saveFlow.port as port'])
    .where({
      'server.host': host,
      'server.port': port,
    })
    .whereBetween('time', [startTime, endTime]);
  }
};

const isDay = (start, end) => {
  let hour;
  let minute;
  let second;
  let millisecond;
  hour = moment(start).get('hour');
  minute = moment(start).get('minute');
  second = moment(start).get('second');
  millisecond = moment(start).get('millisecond');
  if(hour || minute || second || millisecond) {
    return false;
  }
  hour = moment(end).get('hour');
  minute = moment(end).get('minute');
  second = moment(end).get('second');
  millisecond = moment(end).get('millisecond');
  if(hour || minute || second || millisecond) {
    return false;
  }
  if(end >= Date.now()) {
    return false;
  }
  return true;
};

const isHour = (start, end) => {
  let minute;
  let second;
  let millisecond;
  minute = moment(start).get('minute');
  second = moment(start).get('second');
  millisecond = moment(start).get('millisecond');
  if(minute || second || millisecond) {
    return false;
  }
  minute = moment(end).get('minute');
  second = moment(end).get('second');
  millisecond = moment(end).get('millisecond');
  if(minute || second || millisecond) {
    return false;
  }
  if(end >= Date.now()) {
    return false;
  }
  return true;
};

const is5min = (start, end) => {
  let minute;
  let second;
  let millisecond;
  minute = moment(start).get('minute');
  second = moment(start).get('second');
  millisecond = moment(start).get('millisecond');
  if(minute%5 || second || millisecond) {
    return false;
  }
  minute = moment(end).get('minute');
  second = moment(end).get('second');
  millisecond = moment(end).get('millisecond');
  if(minute%5 || second || millisecond) {
    return false;
  }
  if(end >= Date.now()) {
    return false;
  }
  return true;
};

// const child = appFork('plugins/flowSaver/flowChildProcess');
// // child.setMaxListeners(200);
// const splitTimePromises = {};
// const sumFlowPromises = {};
// child.on('message', msg => {
//   if(msg[0] === 'splitTime') {
//     splitTimePromises[msg[1]](msg[2]);
//     delete splitTimePromises[msg[1]];
//   } else if(msg[0] === 'sumFlow') {
//     sumFlowPromises[msg[1]](msg[2]);
//     delete sumFlowPromises[msg[1]];
//   }
// });

// const splitTime = async (start, end) => {
//   const random = Math.random().toString().substr(2);
//   return new Promise((resolve, reject) => {
//     splitTimePromises[random] = resolve;
//     child.send(['splitTime', random, start, end]);
//   });
// };

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
  let last = 'origin';
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
  let getFlow;
  if(serverId) {
    let where = { id: serverId };
    if(accountId) { where.accountId = accountId; }
    getFlow = (tableName, startTime, endTime) => {
      return knex(tableName)
      .sum('flow as sumFlow')
      .groupBy('id')
      .select(['id'])
      .where(where)
      .whereBetween('time', [startTime, endTime - 1]).then(success => {
        if(success[0]) { return success[0].sumFlow; }
        return 0;
      });
    };
  } else {
    getFlow = (tableName, startTime, endTime) => {
      const where = {};
      where[`${ tableName }.accountId`] = accountId;
      let knexQuery = knex(tableName)
      .sum('flow as sumFlow')
      .groupBy('accountId')
      .select(['port']).whereBetween('time', [startTime, endTime - 1])
      .andWhere(where);
      return knexQuery.then(success => {
        if(success[0]) { return success[0].sumFlow; }
        return 0;
      });
    };
  }
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
  const result = await Promise.all(sum);
  return result.length ? result.reduce((a, b) => a + b) : 0;
  // const random = Math.random().toString().substr(2);
  // return new Promise((resolve, reject) => {
  //   sumFlowPromises[random] = resolve;
  //   child.send(['sumFlow', random, result]);
  // });
};

const getFlowFromSplitTimeWithScale = async (serverIds, accountId, start, end) => {
  const time = await splitTime(start, end);
  const sum = [];
  const getFlow = (tableName, startTime, endTime) => {
    const where = {};
    where[`${ tableName }.accountId`] = accountId;
    return knex('server')
    .sum(`${ tableName }.flow as sumFlow`)
    .groupBy(['server.id', `${ tableName }.accountId`])
    .select(['server.id', `${ tableName }.accountId`, 'server.scale'])
    .leftJoin(tableName, `${ tableName }.id`, 'server.id')
    .whereBetween(`${ tableName }.time`, [startTime, endTime - 1])
    .whereIn('server.id', serverIds)
    .andWhere(where);
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
  const result = await Promise.all(sum);
  return result;
};

const getServerFlow = async (serverId, timeArray) => {
  const result = [];
  timeArray.forEach((time, index) => {
    if(index === timeArray.length - 1) {
      return;
    }
    const startTime = +time;
    const endTime = +timeArray[index + 1];
    result.push(getFlowFromSplitTime(serverId, 0, startTime, endTime));
  });
  return Promise.all(result);
};

const getServerPortFlow = async (serverId, accountId, timeArray, isMultiServerFlow) => {
  const result = [];
  timeArray.forEach((time, index) => {
    if(index === timeArray.length - 1) {
      return;
    }
    const startTime = +time;
    const endTime = +timeArray[index + 1];
    result.push(getFlowFromSplitTime(isMultiServerFlow ? 0 : serverId, accountId, startTime, endTime));
  });
  return Promise.all(result);
};

/**
 * 为流量倍率而增加
 */
const getServerPortFlowWithScale = async (serverId, accountId, timeArray, isMultiServerFlow) => {
  const serverIdFilter = {};
  if(!isMultiServerFlow) {
    serverIdFilter.id = serverId;
  }
  const servers = await knex('server').where(serverIdFilter);

  const flows = await getFlowFromSplitTimeWithScale(servers.map(m => m.id), accountId, timeArray[0], timeArray[1]);

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
    sumFlow += Math.ceil(flow * serverObj[s].scale);
  }
  return [ sumFlow ];
  
  // const getOneServerFlow = async (serverId, accountId, timeArray) => {
  //   const result = [];
  //   timeArray.forEach((time, index) => {
  //     if(index === timeArray.length - 1) {
  //       return;
  //     }
  //     const startTime = +time;
  //     const endTime = +timeArray[index + 1];
  //     result.push(getFlowFromSplitTime(serverId, accountId, startTime, endTime));
  //   });
  //   return Promise.all(result);
  // };

  // const flows = await Promise.all(servers.map(server => {
  //   return getOneServerFlow(server.id, accountId, timeArray).then(success => {
  //     return success.map(m => Math.ceil(m * server.scale));
  //   });
  // }));

  // const result = [];
  // flows.forEach(flow => {
  //   flow.forEach((f, index) => {
  //     if(!result[index]) {
  //       result[index] = f;
  //     } else {
  //       result[index] += f;
  //     }
  //   });
  // });
  // console.log(result, sumFlow, result - sumFlow);
  // return result;
};

const getlastConnectTime = async (serverId, accountId) => {
  const lastConnectFromSaveFlow = await knex('saveFlow')
  .select([ 'time' ])
  .where({ id: serverId, accountId })
  .where('flow', '>', 100000)
  .orderBy('time', 'desc').limit(1).then(success => {
    if(success[0]) {
      return success[0].time;
    }
    return 0;
  });
  if(lastConnectFromSaveFlow) {
    return { lastConnect: lastConnectFromSaveFlow };
  }
  return knex('saveFlow5min')
  .select(['time'])
  .where({ id: serverId, accountId })
  .where('flow', '>', 100000)
  .orderBy('time', 'desc').limit(1).then(success => {
    if(success[0]) {
      return { lastConnect: success[0].time };
    }
    return { lastConnect: 0 };
  });
};

const getUserPortLastConnect = async accountId => {
  const servers = await knex('server').select();
  let knexQuery = knex('saveFlow').select(['time']).where({ accountId });
  let knex5MinQuery = knex('saveFlow5min').select(['time']).where({ accountId });
  const lastConnectFromSaveFlow = await knexQuery
  .orderBy('time', 'desc').limit(1).then(success => {
    if(success[0]) {
      return success[0].time;
    }
    return 0;
  });
  if(lastConnectFromSaveFlow) {
    return { lastConnect: lastConnectFromSaveFlow };
  }
  return knex5MinQuery
  .orderBy('time', 'desc').limit(1).then(success => {
    if(success[0]) {
      return { lastConnect: success[0].time };
    }
    return { lastConnect: 0 };
  });
};

const getServerUserFlow = (serverId, timeArray) => {
  const timeStart = timeArray[0];
  const timeEnd = timeArray[1];
  let tableName = 'saveFlow5min';
  if(timeArray.length === 2) {
    if(timeEnd - timeStart === 3600 * 1000 && Date.now() - timeEnd >= 15 * 60 * 1000) {
      tableName = 'saveFlowHour';
    }
    if(timeEnd - timeStart === 24 * 3600 * 1000 && Date.now() - timeEnd >= 3600 * 1000) {
      tableName = 'saveFlowDay';
    }
    if(timeEnd - timeStart === 7 * 24 * 3600 * 1000 && Date.now() - timeEnd >= 3600 * 1000) {
      tableName = 'saveFlowDay';
    }
    timeArray[1] -= 1;
  }
  const where = {};
  where[tableName + '.id'] = +serverId;
  return knex(tableName).sum(`${ tableName }.flow as flow`)
  .select([
    `${ tableName }.port`,
    `${ tableName }.accountId`,
    'user.userName',
  ])
  .groupBy(`${ tableName }.accountId`)
  .leftJoin('account_plugin', 'account_plugin.id', `${ tableName }.accountId`)
  .leftJoin('user', 'account_plugin.userId', 'user.id')
  .where(where).whereBetween(`${ tableName }.time`, timeArray);
};

const getAccountServerFlow = (accountId, timeArray) => {
  const timeStart = timeArray[0];
  const timeEnd = timeArray[1];
  let tableName = 'saveFlow5min';
  if(timeArray.length === 2) {
    if(timeEnd - timeStart === 3600 * 1000 && Date.now() - timeEnd >= 15 * 60 * 1000) {
      tableName = 'saveFlowHour';
    }
    if(timeEnd - timeStart === 24 * 3600 * 1000 && Date.now() - timeEnd >= 3600 * 1000) {
      tableName = 'saveFlowDay';
    }
    if(timeEnd - timeStart === 7 * 24 * 3600 * 1000 && Date.now() - timeEnd >= 3600 * 1000) {
      tableName = 'saveFlowDay';
    }
    timeArray[1] -= 1;
  }
  return knex(tableName).sum(`${ tableName }.flow as flow`).groupBy(`${ tableName }.id`)
  .select([
    'server.name',
  ])
  .leftJoin('server', 'server.id', `${ tableName }.id`)
  .leftJoin('account_plugin', 'account_plugin.id', `${ tableName }.accountId`)
  .where({ 'account_plugin.id': accountId })
  .whereBetween(`${ tableName }.time`, timeArray);
};

const getTopFlow = groupId => {
  const startTime = moment().hour(0).minute(0).second(0).millisecond(0).toDate().getTime();
  const endTime = Date.now();
  const where = {};
  if(groupId >= 0) { where['user.group'] = groupId; }
  return knex('saveFlow').sum('saveFlow.flow as sumFlow')
  .groupBy('user.id')
  .orderBy('sumFlow', 'desc')
  .limit(5)
  .select([
    'user.id as userId',
    'user.username as email',
    'account_plugin.port as port',
    'account_plugin.id as accountId',
  ])
  .leftJoin('account_plugin', 'account_plugin.id', 'saveFlow.accountId')
  .innerJoin('user', 'account_plugin.userId', 'user.id')
  .whereBetween('saveFlow.time', [startTime, endTime]).where(where);
};

const cleanAccountFlow = async id => {
  const account = await knex('account_plugin').where({ id }).then(s => s[0]);
  if(!account) { return Promise.reject('account id not found'); }
  await knex('saveFlow').update({ accountId: 0 }).where({ accountId: id });
  await knex('saveFlow5min').update({ accountId: 0 }).where({ accountId: id });
  await knex('saveFlowHour').update({ accountId: 0 }).where({ accountId: id });
  await knex('saveFlowDay').update({ accountId: 0 }).where({ accountId: id });
};

exports.getFlow = getFlow;
exports.getTopFlow = getTopFlow;
exports.getServerFlow = getServerFlow;
exports.getServerPortFlow = getServerPortFlow;
exports.getServerPortFlowWithScale = getServerPortFlowWithScale;
exports.getServerUserFlow = getServerUserFlow;
exports.getlastConnectTime = getlastConnectTime;
exports.getAccountServerFlow = getAccountServerFlow;
exports.getUserPortLastConnect = getUserPortLastConnect;

exports.getFlowFromSplitTime = getFlowFromSplitTime;
exports.getFlowFromSplitTimeWithScale = getFlowFromSplitTimeWithScale;
exports.cleanAccountFlow = cleanAccountFlow;
