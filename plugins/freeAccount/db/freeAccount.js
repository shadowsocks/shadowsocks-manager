const knex = appRequire('init/knex').knex;
const tableName = 'freeAccount';

const config = appRequire('services/config').all();
const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    return;
  }
  return knex.schema.createTable(tableName, function(table) {
    table.string('key').primary();
    table.string('value');
  });
};

exports.createTable = createTable;
