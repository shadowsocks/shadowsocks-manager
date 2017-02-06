'use strict';

const knex = appRequire('init/knex').knex;
const tableName = 'alipay';

const config = appRequire('services/config').all();
const createTable = async() => {
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    return;
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id').primary();
    table.string('orderId').unique();
    table.string('amount');
    table.string('status');
    table.dateTime('createTime');
  });
};

exports.createTable = createTable;
