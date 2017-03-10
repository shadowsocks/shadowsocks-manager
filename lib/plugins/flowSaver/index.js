function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const log4js = require('log4js');
const logger = log4js.getLogger('flowSaver');
const path = require('path');
appRequire('plugins/flowSaver/server');
appRequire('plugins/flowSaver/flow');
const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const later = require('later');
const moment = require('moment');
later.date.localTime();
const minute = 1;
const sched0 = later.parse.recur().every(minute).minute();
const time = minute * 60 * 1000;

const saveFlow = (() => {
  var _ref = _asyncToGenerator(function* () {
    try {
      const servers = yield knex('server').select(['id', 'name', 'host', 'port', 'password']);
      const promises = [];
      servers.forEach(function (server) {
        const saveServerFlow = (() => {
          var _ref2 = _asyncToGenerator(function* (server) {
            const lastestFlow = yield knex('saveFlow').select(['time']).where({
              id: server.id
            }).orderBy('time', 'desc').limit(1);
            if (lastestFlow.length === 0 || Date.now() - lastestFlow[0].time >= time) {
              const options = {
                clear: true
              };
              let flow = yield manager.send({
                command: 'flow',
                options: options
              }, {
                host: server.host,
                port: server.port,
                password: server.password
              });
              flow = flow.map(function (f) {
                return {
                  id: server.id,
                  port: f.port,
                  flow: f.sumFlow,
                  time: Date.now()
                };
              }).filter(function (f) {
                return f.flow > 0;
              });
              if (flow.length === 0) {
                return;
              }
              yield knex('saveFlow').insert(flow);
            }
          });

          return function saveServerFlow(_x) {
            return _ref2.apply(this, arguments);
          };
        })();
        promises.push(saveServerFlow(server));
      });
      yield Promise.all(promises);
    } catch (err) {
      logger.error(err);
      return;
    }
  });

  return function saveFlow() {
    return _ref.apply(this, arguments);
  };
})();

saveFlow();
const timer0 = later.setInterval(() => {
  saveFlow();
}, sched0);