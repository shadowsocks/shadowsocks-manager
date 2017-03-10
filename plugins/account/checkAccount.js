const log4js = require('log4js');
const logger = log4js.getLogger('account');
const knex = appRequire('init/knex').knex;
const serverManager = appRequire('plugins/flowSaver/server');
const flow = appRequire('plugins/flowSaver/flow');
const manager = appRequire('services/manager');
const moment = require('moment');

let messages = [];

const sendMessage = () => {
  if(!messages.length) {
    return;
  }
  messages.forEach(message => {
    // console.log(message);
    manager.send(message[0], message[1]).then().catch();
  });
  messages = [];
};

setInterval(() => {
  sendMessage();
}, 10 * 1000);

const addPort = (data, server) => {
  messages.push([{
    command: 'add',
    port: data.port,
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
    port: data.port,
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
      port,
      password,
    }, {
      host: s.host,
      port: s.port,
      password: s.password,
    }]);
  });
  return;
};

const checkFlow = async (server, port, startTime, endTime) => {
  const flow = await knex('saveFlow')
  .sum('flow as sumFlow')
  .groupBy('port')
  .select(['port'])
  .where({id: server, port,})
  .whereBetween('time', [startTime, endTime]);
  return flow[0] ? flow[0].sumFlow : 0;
};

const checkServer = async () => {
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
  account.exist = number => {
    return !!account.filter(f => f.port === number)[0];
  };
  const promises = [];
  server.forEach(s => {
    const checkServerAccount = async s => {
      try {
        const port = await manager.send({ command: 'list' }, {
          host: s.host,
          port: s.port,
          password: s.password,
        });
        port.exist = number => {
          return !!port.filter(f => f.port === number)[0];
        };
        account.forEach(async a => {
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
            const flow = await checkFlow(s.id, a.port, startTime, Date.now());
            if(flow >= data.flow) {
              port.exist(a.port) && delPort(a, s);
              return;
            } else if(data.create + data.limit * timePeriod <= Date.now() || data.create >= Date.now()) {
              port.exist(a.port) && delPort(a, s);
              return;
            } else if(!port.exist(a.port)) {
              addPort(a, s);
              return;
            }
          } else if (a.type === 1) {
            if(port.exist(a.port)) {
              return;
            }
            addPort(a, s);
            return;
          }
        });
        port.forEach(async p => {
          if(!account.exist(p.port)) {
            delPort(p, s);
            return;
          }
        });
      } catch (err) {
        logger.error(err);
        return;
      }
    };
    promises.push(checkServerAccount(s));
  });
  Promise.all(promises);
};

exports.checkServer = checkServer;
exports.sendMessage = sendMessage;
exports.addPort = addPort;
exports.delPort = delPort;
exports.changePassword = changePassword;

setTimeout(() => {
  // TODO: fix load plugins
  checkServer();
}, 10 * 1000);
setInterval(() => {
  checkServer();
}, 60 * 1000);
