'use strict';

const knex = appRequire('init/knex').knex;
const config = appRequire('services/config').all();
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

const getServerFlow = async (serverId, timeArray) => {
  const result = [];
  timeArray.forEach((time, index) => {
    if(index === timeArray.length - 1) {
      return;
    }
    const startTime = +time;
    const endTime = +timeArray[index + 1];
    const getFlow = knex('saveFlow')
    .sum('flow as sumFlow')
    .groupBy('id')
    .select(['id'])
    .where({ id: serverId })
    .whereBetween('time', [startTime, endTime]).then(success => {
      if(success[0]) { return success[0].sumFlow; }
      return 0;
    });
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

exports.getFlow = getFlow;
exports.getServerFlow = getServerFlow;
exports.getServerPortFlow = getServerPortFlow;
exports.getlastConnectTime = getlastConnectTime;
