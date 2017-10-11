const knex = appRequire('init/knex').knex;
const tableName = 'account_plugin';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    return;
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id');
    table.integer('type');
    table.integer('userId');
    table.string('server');
    table.integer('port').unique();
    table.string('password');
    table.string('data');
    table.integer('status');
    table.integer('autoRemove').defaultTo(0);
  });
};

exports.createTable = createTable;
