const knex = appRequire('init/knex').knex;
const tableName = 'giftcard';

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    const hasOrderId = await knex.schema.hasColumn(tableName, 'orderId');
    if(!hasOrderId) {
      await knex.schema.table(tableName, function(table) {
        table.integer('orderId');
      });
    }
    const results = await knex(tableName).whereNull('orderId');
    for(const result of results) {
      await knex(tableName).update({ orderId: result.orderType }).where({ id: result.id });
    }
    return;
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id').primary();
    table.string('password').unique().notNull();
    table.integer('orderId');
    table.integer('orderType').notNull();
    table.string('status').notNull();
    table.integer('batchNumber').notNull();
    table.integer('user');
    table.integer('account');
    table.bigInteger('createTime').notNull();
    table.bigInteger('usedTime');
    table.string('comment').defaultTo('');
  });
};

exports.createTable = createTable;
exports.tableName = tableName;
