'use strict';

const knex = appRequire('init/knex').knex;

const add = (name, host, port, password) => {
  return knex('server').insert({
    name,
    host,
    port,
    password
  });
};

const del = name => {
  return knex.transaction(trx => {
    return knex('server').transacting(trx).where({ name }).delete().then(() => {
      return knex('saveFlow').transacting(trx).where({ name }).delete();
    }).then(trx.commit).catch(trx.rollback);
  });
};

const edit = (oldName, name, host, port, password) => {
  return knex.transaction(trx => {
    return knex('server').transacting(trx).where({ name: oldName }).update({
      name,
      host,
      port,
      password
    }).then(() => {
      return knex('saveFlow').transacting(trx).where({ name: oldName }).update({
        name
      });
    }).then(trx.commit).catch(trx.rollback);
  });
};

const list = () => {
  return knex('server').select(['name', 'host', 'port', 'password']);
};

exports.add = add;
exports.del = del;
exports.edit = edit;
exports.list = list;