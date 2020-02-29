const knex = appRequire('init/knex').knex;
const tableName = 'webgui_free_account';

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) { return; }
  return knex.schema.createTable(tableName, function(table) {
    table.increments('id').primary();
    table.integer('userId');
    table.bigInteger('createTime');
  });
};

exports.createTable = createTable;
