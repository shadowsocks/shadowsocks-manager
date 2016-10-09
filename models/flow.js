'use strict';

const knex = appRequire('init/knex').knex;
const tableName = 'flow';

const config = appRequire('services/config').all();
const createTable = async() => {
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.integer('port');
    table.integer('flow');
    table.dateTime('time');
  });
};
createTable().then();
