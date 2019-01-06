const knex = appRequire('init/knex').knex;
const tableName = 'webguiSetting';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    return;
  }
  return knex.schema.createTable(tableName, function(table) {
    table.increments('id').primary();
    table.string('key').unique();
    table.string('value', 16384);
  });
};

exports.createTable = createTable;
