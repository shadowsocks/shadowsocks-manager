const knex = appRequire('init/knex').knex;
const tableName = 'notice';

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
    table.increments('id').primary();
    table.string('title');
    table.string('content', 16384);
    table.bigInteger('time');
  });
};

exports.createTable = createTable;
