'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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
  if (arguments[3]) {
    const host = arguments[0];
    const port = arguments[1];
    const startTime = arguments[2];
    const endTime = arguments[3];
    return knex('saveFlow').innerJoin('server', 'server.id', 'saveFlow.id').sum('flow as sumFlow').groupBy('saveFlow.port').select(['saveFlow.port as port']).where({
      'server.host': host,
      'server.port': port
    }).whereBetween('time', [startTime, endTime]);
  } else if (arguments[2]) {
    const id = arguments[0];
    const startTime = arguments[1];
    const endTime = arguments[2];
    return knex('saveFlow').sum('flow as sumFlow').groupBy('port').select(['port']).where({ id }).whereBetween('time', [startTime, endTime]);
  } else {
    const host = config.manager.address.split(':')[0];
    const port = +config.manager.address.split(':')[1];
    const startTime = arguments[0];
    const endTime = arguments[1];
    return knex('saveFlow').innerJoin('server', 'server.id', 'saveFlow.id').sum('flow as sumFlow').groupBy('saveFlow.port').select(['saveFlow.port as port']).where({
      'server.host': host,
      'server.port': port
    }).whereBetween('time', [startTime, endTime]);
  }
};

const getServerFlow = (() => {
  var _ref = _asyncToGenerator(function* (serverId, timeArray) {
    const result = [];
    timeArray.forEach(function (time, index) {
      if (index === timeArray.length - 1) {
        return;
      }
      const startTime = time;
      const endTime = timeArray[index + 1];
      const getFlow = knex('saveFlow').sum('flow as sumFlow').groupBy('port').select(['port']).where({ id: serverId }).whereBetween('time', [startTime, endTime]).then(function (success) {
        if (success[0]) {
          return success[0].sumFlow;
        }
        return 0;
      });
      result.push(getFlow);
    });
    return Promise.all(result);
  });

  return function getServerFlow(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

const getServerPortFlow = (() => {
  var _ref2 = _asyncToGenerator(function* (serverId, port, timeArray) {
    const result = [];
    timeArray.forEach(function (time, index) {
      if (index === timeArray.length - 1) {
        return;
      }
      const startTime = time;
      const endTime = timeArray[index + 1];
      const getFlow = knex('saveFlow').sum('flow as sumFlow').groupBy('port').select(['port']).where({ id: serverId, port }).whereBetween('time', [startTime, endTime]).then(function (success) {
        if (success[0]) {
          return success[0].sumFlow;
        }
        return 0;
      });
      result.push(getFlow);
    });
    return Promise.all(result);
  });

  return function getServerPortFlow(_x3, _x4, _x5) {
    return _ref2.apply(this, arguments);
  };
})();

exports.getFlow = getFlow;
exports.getServerFlow = getServerFlow;
exports.getServerPortFlow = getServerPortFlow;