const knex = appRequire('init/knex').knex;
const tableName = 'mac_account';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) { return; }
  return knex.schema.createTable(tableName, function(table) {
    table.increments('id');
    table.string('mac').unique();
    table.integer('userId');
    table.integer('accountId');
    table.integer('serverId');
  });
};

exports.createTable = createTable;
