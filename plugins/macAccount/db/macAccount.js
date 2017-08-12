const knex = appRequire('init/knex').knex;
const tableName = 'mac_account';

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
    table.increments('id');
    table.string('mac').unique();
    table.integer('userId');
    table.integer('accountId');
    table.integer('serverId');
  });
};

exports.createTable = createTable;
