'use strict';

const manager = appRequire('services/manager');
const knex = appRequire('init/knex').knex;

exports.getServers = (req, res) => {
  knex('server').select().then(success => {
    res.send(success);
  }).catch(err => {
    res.status(500).end();
  });
};

exports.getOneServer = (req, res) => {
  const serverName = req.params.serverName;
  let result = null;
  knex('server').select().where({
    name: serverName,
  }).then(success => {
    if(success.length) {
      result = success[0];
      return manager.send({
        command: 'list',
        port: success[0].port,
        password: success[0].password,
      });
    }
    res.status(404).end();
  }).then(success => {
    result.ports = success;
    res.send(result);
  }).catch(err => {
    res.status(500).end();
  });
};
