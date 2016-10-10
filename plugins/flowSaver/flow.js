'use strict';

const knex = appRequire('init/knex').knex;
// const moment = require('moment');

const getFlow = (name, startTime, endTime) => {
  return knex('saveFlow')
  .sum('flow as sumFlow')
  .groupBy('port')
  .select(['port'])
  .where({name})
  .whereBetween('time', [startTime, endTime]);
};

// const start = Date.now() - 5 * 60 * 1000;
// const end = Date.now();
// list('v1', start, end).then(s => console.log(s)).catch(e => console.log(e));
exports.getFlow = getFlow;
