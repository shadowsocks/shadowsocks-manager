const knex = appRequire('init/knex').knex;
const tableName = 'port';

const config = appRequire('services/config').all();
const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    return;
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.string('user').primary();
    table.bigInteger('create');
    table.bigInteger('update');
    table.bigInteger('flow');
    table.bigInteger('balance');
    table.integer('port');
    table.string('password');
  });
};

exports.createTable = createTable;
