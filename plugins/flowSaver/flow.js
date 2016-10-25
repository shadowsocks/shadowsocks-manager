'use strict';

const knex = appRequire('init/knex').knex;

/*
arguments: name, startTime, endTime
  or
arguments: host, port, startTime, endTime
 */
const getFlow = function () {
  if(arguments[3]) {
    const host = arguments[0];
    const port = arguments[1];
    const startTime = arguments[2];
    const endTime = arguments[3];
    return knex('saveFlow').innerJoin('server', 'server.name', 'saveFlow.name')
    .sum('flow as sumFlow')
    .groupBy('saveFlow.port')
    .select(['saveFlow.port as port'])
    .where({
      'server.host': host,
      'server.port': port,
    })
    .whereBetween('time', [startTime, endTime]);
  } else {
    const name = arguments[0];
    const startTime = arguments[1];
    const endTime = arguments[2];
    return knex('saveFlow')
    .sum('flow as sumFlow')
    .groupBy('port')
    .select(['port'])
    .where({name})
    .whereBetween('time', [startTime, endTime]);
  }
};

// const start = Date.now() - 5 * 60 * 1000;
// const end = Date.now();
// list('v1', start, end).then(s => console.log(s)).catch(e => console.log(e));
exports.getFlow = getFlow;
