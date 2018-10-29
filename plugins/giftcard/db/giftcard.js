const knex = appRequire('init/knex').knex;
const tableName = 'giftcard';

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) { return; }
  return knex.schema.createTable(tableName, function(table) {
    table.increments('id').primary();
    table.string('password').unique().notNull();
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
