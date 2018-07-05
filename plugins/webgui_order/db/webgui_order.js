const knex = appRequire('init/knex').knex;
const tableName = 'webgui_order';

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) { return; }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id').primary();
    table.string('name');
    table.string('comment').defaultTo('');
    table.integer('type');
    table.integer('cycle');
    table.integer('alipay');
    table.integer('paypal');
    table.bigInteger('flow');
    table.integer('refTime');
    table.string('server');
    table.integer('autoRemove').defaultTo(0);
    table.integer('multiServerFlow').defaultTo(0);
    table.integer('changeOrderType').defaultTo(0);
  });
};

exports.createTable = createTable;
