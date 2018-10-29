const knex = appRequire('init/knex').knex;
const tableName = 'webgui_ref';

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) { return; }
  return knex.schema.createTable(tableName, function(table) {
    table.increments('id').primary();
    table.integer('codeId');
    table.integer('userId');
    table.bigInteger('time');
  });
};

exports.createTable = createTable;
