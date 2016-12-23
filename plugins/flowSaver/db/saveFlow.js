'use strict';

const knex = appRequire('init/knex').knex;
const tableName = 'saveFlow';

const config = appRequire('services/config').all();
const createTable = async() => {
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.integer('id');
    table.integer('port');
    table.integer('flow');
    table.dateTime('time');
  });
};

exports.createTable = createTable;
