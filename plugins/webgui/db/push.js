const knex = appRequire('init/knex').knex;
const tableName = 'push';

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
    table.string('endpoint').unique();
    table.string('auth');
    table.string('p256dh');
  });
};

exports.createTable = createTable;
