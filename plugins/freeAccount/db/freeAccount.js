const knex = appRequire('init/knex').knex;
const tableName = 'freeAccount';

const config = appRequire('services/config').all();
const createTable = async() => {
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.string('key').primary();
    table.string('value');
  });
};

exports.createTable = createTable;
