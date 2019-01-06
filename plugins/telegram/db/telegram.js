const knex = appRequire('init/knex').knex;
const tableName = 'telegram';

const config = appRequire('services/config').all();
const createTable = async() => {
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  return knex.schema.createTable(tableName, function(table) {
    table.string('key');
    table.string('value');
  });
};

exports.createTable = createTable;
