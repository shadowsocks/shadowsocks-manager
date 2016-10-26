'use strict';

const knex = appRequire('init/knex').knex;
const tableName = 'user';

const config = appRequire('services/config').all();
const createTable = async() => {
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.string('username').primary();
    table.string('email').unique();
    table.string('password');
    table.string('type');
    table.dateTime('createTime');
  });
};

exports.createTable = createTable;
