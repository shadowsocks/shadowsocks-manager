'use strict';

const knex = appRequire('init/knex').knex;
const tableName = 'user';

const config = appRequire('services/config').all();
const createTable = async() => {
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id').primary();
    table.string('username');
    table.string('email');
    table.string('telegram');
    table.string('password');
    table.string('type');
    table.dateTime('createTime');
    table.dateTime('LastLogin');
  });
};

exports.createTable = createTable;
