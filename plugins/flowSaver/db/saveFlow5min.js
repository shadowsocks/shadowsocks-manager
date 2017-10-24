const knex = appRequire('init/knex').knex;
const tableName = 'saveFlow5min';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    const hasColumnAccountId = await knex.schema.hasColumn(tableName, 'accountId');
    if(!hasColumnAccountId) {
      await knex.schema.table(tableName, function(table) {
        table.integer('accountId').defaultTo(0);
      });
    }
    return;
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.integer('id');
    table.integer('accountId').defaultTo(0);
    table.integer('port');
    table.bigInteger('flow');
    table.bigInteger('time');
    table.index(['time', 'port'], '5minIndex');
  });
};

exports.createTable = createTable;
