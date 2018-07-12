const knex = appRequire('init/knex').knex;
const tableName = 'account_plugin';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    const hasSubscribe = await knex.schema.hasColumn(tableName, 'subscribe');
    if(!hasSubscribe) {
      await knex.schema.table(tableName, function(table) {
        table.string('subscribe');
      });
    }
    const hasOrderId = await knex.schema.hasColumn(tableName, 'orderId');
    if(!hasOrderId) {
      await knex.schema.table(tableName, function(table) {
        table.integer('orderId');
      });
    }
    const results = await knex(tableName).whereNull('orderId');
    for(const result of results) {
      await knex(tableName).update({ orderId: result.type === 1 ? 0 : result.type }).where({ id: result.id });
    }
    return;
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id');
    table.integer('type');
    table.integer('orderId');
    table.integer('userId');
    table.string('server');
    table.integer('port').unique();
    table.string('password');
    table.string('data');
    table.string('subscribe');
    table.integer('status');
    table.integer('autoRemove').defaultTo(0);
    table.integer('multiServerFlow').defaultTo(0);
  });
};

exports.createTable = createTable;
