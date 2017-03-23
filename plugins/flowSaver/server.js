'use strict';

const knex = appRequire('init/knex').knex;

const add = (name, hostname, host, port, password, method) => {
  return knex('server').insert({
    name,
    hostname,
    host,
    port,
    password,
    method,
  });
};

const del = (id) => {
  return knex.transaction(trx => {
    return knex('server').transacting(trx).where({ id }).delete()
    .then(() => {
      return knex('saveFlow').transacting(trx).where({ id }).delete();
    })
    .then(trx.commit)
    .catch(trx.rollback);
  });
};

const edit = (id, name, hostname, host, port, password, method) => {
  return knex('server').where({ id }).update({
    name,
    hostname,
    host,
    port,
    password,
    method,
  });
};

const list = () => {
  return knex('server').select(['id', 'name', 'hostname', 'host', 'port', 'password', 'method']).orderBy('name');
};

exports.add = add;
exports.del = del;
exports.edit = edit;
exports.list = list;
