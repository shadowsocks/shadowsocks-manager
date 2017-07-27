const knex = appRequire('init/knex').knex;
const tableName = 'webguiSetting';

const config = appRequire('services/config').all();
const createTable = async() => {
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    return knex.schema.raw('alter table webguiSetting modify column value varchar(16384)');
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id').primary();
    table.string('key').unique();
    table.string('value', 16384);
  });
};

exports.createTable = createTable;
