'use strict';

const knex = appRequire('init/knex').knex;
const tableName = 'account';

const config = appRequire('services/config').all();
const createTable = async() => {
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.integer('port').primary();
    table.string('password');
  });
};
createTable().then();
