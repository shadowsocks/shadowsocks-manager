const knex = appRequire('init/knex').knex;
const serverManager = appRequire('plugins/flowSaver/server');
const manager = appRequire('services/manager');

let messages = [];

setInterval(() => {
  if(!messages.length) {
    return;
  }
  messages.forEach(message => {
    // console.log(message);
    manager.send(message[0], message[1]).then().catch();
  });
  messages = [];
}, 10 * 1000);

const checkServer = async () => {
  const account = await knex('account_plugin').select();
  const server = await serverManager.list();
  // console.log(server);
  // console.log(account);
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
    port.exist = number => {
      return !!port.filter(f => f.port === number)[0];
    };
    account.forEach(async a => {
      if(!port.exist(a.port)) {
        messages.push([{
          command: 'add',
          port: a.port,
          password: a.password,
        }, {
          host: s.host,
          port: s.port,
          password: s.password,
        }]);
      }
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
