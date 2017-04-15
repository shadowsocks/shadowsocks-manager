const knex = appRequire('init/knex').knex;
const tableName = 'account';

const config = appRequire('services/config').all();
const createTable = async() => {
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    return;
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.integer('port').primary();
    table.string('password');
  });
};

exports.createTable = createTable;
