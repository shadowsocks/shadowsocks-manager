'use strict';

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
  if(moment().hour(0).minute(0).second(0).millisecond(0).toDate().getTime() === start) {
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
  if(moment().minute(0).second(0).millisecond(0).toDate().getTime() === start) {
    return false;
  }
  return true;
};

const getServerFlow = async (serverId, timeArray) => {
  const result = [];
  timeArray.forEach((time, index) => {
    if(index === timeArray.length - 1) {
      return;
    }
    const startTime = +time;
    const endTime = +timeArray[index + 1];
    let getFlow;
    if(isDay(startTime, endTime)) {
      getFlow = knex('saveFlowDay')
      .sum('flow as sumFlow')
      .groupBy('id')
      .select(['id'])
      .where({ id: serverId })
      .whereBetween('time', [startTime, endTime]).then(success => {
        if(success[0]) { return success[0].sumFlow; }
        return 0;
      });
    } else if(isHour(startTime, endTime)) {
      getFlow = knex('saveFlowHour')
      .sum('flow as sumFlow')
      .groupBy('id')
      .select(['id'])
      .where({ id: serverId })
      .whereBetween('time', [startTime, endTime]).then(success => {
        if(success[0]) { return success[0].sumFlow; }
        return 0;
      });
    } else {
      getFlow = knex('saveFlow')
      .sum('flow as sumFlow')
      .groupBy('id')
      .select(['id'])
      .where({ id: serverId })
      .whereBetween('time', [startTime, endTime]).then(success => {
        if(success[0]) { return success[0].sumFlow; }
        return 0;
      });
    }
    result.push(getFlow);
  });
  return Promise.all(result);
};

const getServerPortFlow = async (serverId, port, timeArray) => {
  const result = [];
  timeArray.forEach((time, index) => {
    if(index === timeArray.length - 1) {
      return;
    }
    const startTime = time;
    const endTime = timeArray[index + 1];
    const getFlow = knex('saveFlow')
    .sum('flow as sumFlow')
    .groupBy('port')
    .select(['port'])
    .where({ id: serverId, port })
    .whereBetween('time', [startTime, endTime]).then(success => {
      if(success[0]) { return success[0].sumFlow; }
      return 0;
    });
    result.push(getFlow);
  });
  return Promise.all(result);
};

const getlastConnectTime = (serverId, port) => {
  return knex('saveFlow')
  .select(['time'])
  .where({ id: serverId, port })
  .orderBy('time', 'desc').limit(1).then(success => {
    if(success[0]) {
      return { lastConnect: success[0].time };
    }
    return { lastConnect: 0 };
  });
};

const getServerUserFlow = (serverId, timeArray) => {
  return knex('saveFlow').sum('saveFlow.flow as flow')
  .select([
    'saveFlow.port',
    'user.userName',
  ])
  .groupBy('saveFlow.port')
  .leftJoin('account_plugin', 'account_plugin.port', 'saveFlow.port')
  .leftJoin('user', 'account_plugin.userId', 'user.id')
  .where({
    'saveFlow.id': +serverId,
  }).whereBetween('saveFlow.time', timeArray);
};

const getAccountServerFlow = (accountId, timeArray) => {
  return knex('saveFlow').sum('saveFlow.flow as flow').groupBy('saveFlow.id')
  .select([
    'server.name',
  ])
  .leftJoin('server', 'server.id', 'saveFlow.id')
  .leftJoin('account_plugin', 'account_plugin.port', 'saveFlow.port')
  .where({ 'account_plugin.id': accountId })
  .whereBetween('saveFlow.time', timeArray);
  ;
};

exports.getFlow = getFlow;
exports.getServerFlow = getServerFlow;
exports.getServerPortFlow = getServerPortFlow;
exports.getServerUserFlow = getServerUserFlow;
exports.getlastConnectTime = getlastConnectTime;
exports.getAccountServerFlow = getAccountServerFlow;
