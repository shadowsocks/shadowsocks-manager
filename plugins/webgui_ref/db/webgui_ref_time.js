const knex = appRequire('init/knex').knex;
const tableName = 'webgui_ref_time';

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) { return; }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id').primary();
    table.string('orderId').unique();
    table.integer('user');
    table.bigInteger('refTime');
    table.bigInteger('createTime');
  });
};

exports.createTable = createTable;