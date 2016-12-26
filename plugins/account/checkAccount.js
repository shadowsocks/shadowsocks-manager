const knex = appRequire('init/knex').knex;
const serverManager = appRequire('plugins/flowSaver/server');
const flow = appRequire('plugins/flowSaver/flow');
const manager = appRequire('services/manager');
const moment = require('moment');

let messages = [];

setInterval(() => {
  if(!messages.length) {
    return;
  }
  messages.forEach(message => {
    console.log(message);
    manager.send(message[0], message[1]).then().catch();
  });
  messages = [];
}, 10 * 1000);

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
  const server = await serverManager.list();
  account.exist = number => {
    return !!account.filter(f => f.port === number)[0];
  };
  server.forEach(async s => {
    const port = await manager.send({
      command: 'list',
    }, {
      host: s.host,
      port: s.port,
      password: s.password,
    });
    // console.log(port);
    // console.log(account);
    // console.log();
    port.exist = number => {
      return !!port.filter(f => f.port === number)[0];
    };
    account.forEach(async a => {
      if(a.type === 2) {
        // console.log(JSON.parse(a.data));
        const flow = await checkFlow(s.id, a.port, Date.now() - 86400000, Date.now());
      }
      if(port.exist(a.port)) {
        return;
      }
      messages.push([{
        command: 'add',
        port: a.port,
        password: a.password,
      }, {
        host: s.host,
        port: s.port,
        password: s.password,
      }]);
    });
    port.forEach(async p => {
      if(!account.exist(p.port)) {
        messages.push([{
          command: 'del',
          port: p.port,
          password: p.password,
        }, {
          host: s.host,
          port: s.port,
          password: s.password,
        }]);
      }
    });
  });
};

exports.checkServer = checkServer;

checkServer();
setInterval(() => {
  checkServer();
}, 120 * 1000);
