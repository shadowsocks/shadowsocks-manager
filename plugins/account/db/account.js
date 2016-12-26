'use strict';

const knex = appRequire('init/knex').knex;
const tableName = 'account_plugin';

const config = appRequire('services/config').all();
const createTable = async() => {
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id');
    table.integer('type');
    table.integer('userId');
    table.string('server');
    table.integer('port');
    table.string('password');
    table.string('data');
  });
};

exports.createTable = createTable;
