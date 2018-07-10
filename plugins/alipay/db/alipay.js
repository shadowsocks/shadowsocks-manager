const knex = appRequire('init/knex').knex;
const tableName = 'alipay';

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    const hasCycle = await knex.schema.hasColumn(tableName, 'cycle');
    if(!hasCycle) {
      await knex.schema.table(tableName, function(table) {
        table.integer('cycle');
      });
    }
    const results = await knex(tableName).whereNull('cycle');
    for(const result of results) {
      if(result.orderType === 6) {
        await knex(tableName).update({ cycle: 3 }).where({ id: result.id });
      } else if(result.orderType === 7) {
        await knex(tableName).update({ cycle: 12 }).where({ id: result.id });
      } else {
        await knex(tableName).update({ cycle: 1 }).where({ id: result.id });
      }
    }
    return;
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id').primary();
    table.string('orderId').unique();
    table.integer('orderType').defaultTo(3);
    table.integer('cycle');
    table.string('amount');
    table.integer('user');
    table.integer('account');
    table.string('qrcode');
    table.string('status');
    table.string('alipayData', 4096);
    table.bigInteger('createTime');
    table.bigInteger('expireTime');
  });
};

exports.createTable = createTable;
