'use strict';

const knex = appRequire('init/knex').knex;
const tableName = 'server';
const config = appRequire('services/config').all();

const createTable = async() => {
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  await knex.schema.createTableIfNotExists(tableName, function(table) {
    table.string('name');
    table.string('host');
    table.integer('port');
    table.string('password');
  });
  const list = await knex('server').select(['name', 'host', 'port', 'password']);
  if(list.length === 0) {
    const host = config.manager.address.split(':')[0];
    const port = +config.manager.address.split(':')[1];
    const password = config.manager.password;
    await knex('server').insert({
      name: 'default',
      host,
      port,
      password,
    });
  }
  return;
};

exports.createTable = createTable;
