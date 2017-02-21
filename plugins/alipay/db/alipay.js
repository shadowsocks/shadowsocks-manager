'use strict';

const knex = appRequire('init/knex').knex;
const tableName = 'alipay';

const config = appRequire('services/config').all();
const createTable = async() => {
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  const exist = await knex.schema.hasTable(tableName);
  // if(exist) {
  //   return;
  // }
  if(exist) {
    return knex.schema.hasColumn('alipay', 'orderType')
    .then(exist => {
      if(!exist) {
        return knex.schema.table('alipay', table => {
          table.integer('orderType').defaultTo(3);
        });
      }
      return;
    });
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id').primary();
    table.string('orderId').unique();
    table.integer('orderType').defaultTo(3);
    table.string('amount');
    table.integer('user');
    table.integer('account');
    table.string('qrcode');
    table.string('status');
    table.string('alipayData');
    table.dateTime('createTime');
    table.dateTime('expireTime');
  });
};

exports.createTable = createTable;
