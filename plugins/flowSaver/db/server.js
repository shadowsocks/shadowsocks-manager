'use strict';

const knex = appRequire('init/knex').knex;
const tableName = 'server';

const config = appRequire('services/config').all();
const createTable = async() => {
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.string('name');
    table.string('host');
    table.integer('port');
    table.string('password');
  });
};

exports.createTable = createTable;
