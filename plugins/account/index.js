'use strict';

const knex = appRequire('init/knex').knex;
const serverManager = appRequire('plugins/flowSaver/server');
const manager = appRequire('services/manager');

const addAccount = async (type, options) => {
  if(type === 1) {
    await knex('account_plugin').insert({
      type: 1,
      userId: options.user,
      port: options.port,
      password: options.password,
    });
    return;
  }
};

const getAccount = async () => {
  const account = await knex('account_plugin').select();
  return account;
};

exports.addAccount = addAccount;
exports.getAccount = getAccount;

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
        manager.send({
          command: 'add',
          port: a.port,
          password: a.password,
        }, {
          host: s.host,
          port: s.port,
          password: s.password,
        }).then(console.log).catch(console.log);
      }
    });
    port.forEach(async p => {
      if(!account.exist(p.port)) {
        manager.send({
          command: 'del',
          port: p.port,
          password: p.password,
        }, {
          host: s.host,
          port: s.port,
          password: s.password,
        }).then(console.log).catch(console.log);
      }
    });
  });
};

checkServer();
setInterval(() => {
  checkServer();
}, 120 * 1000);
