'use strict';

const knex = appRequire('init/knex').knex;
const tableName = 'freeAccount';

const config = appRequire('services/config').all();
const createTable = async() => {
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.string('address').primary();
    table.string('email');
    table.integer('port');
    table.integer('flow');
    table.integer('currentFlow');
    table.bigInteger('time');
    table.bigInteger('expired');
    table.boolean('isDisabled');
  });
};

exports.createTable = createTable;
