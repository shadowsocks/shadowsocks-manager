'use strict';

const knex = appRequire('init/knex').knex;

const add = (name, host, port, password) => {
  return knex('server').insert({
    name,
    host,
    port,
    password,
  });
};

const del = (name) => {
  return knex('server').where({name}).delete();
};

const edit = (name, host, port, password) => {
  return knex('server').where({name}).update({
    host,
    port,
    password,
  });
};

const list = () => {
  return knex('server').select(['name', 'host', 'port', 'password']);
};

exports.add = add;
exports.del = del
exports.edit = edit;
exports.list = list;
