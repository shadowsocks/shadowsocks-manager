const knex = appRequire('init/knex').knex;
const tableName = 'account_flow';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    const hasStatus = await knex.schema.hasColumn(tableName, 'status');
    if(!hasStatus) {
      await knex.schema.table(tableName, function(table) {
        table.string('status').defaultTo('checked');
      });
    }
    return;
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id');
    table.integer('serverId');
    table.integer('accountId');
    table.integer('port');
    table.bigInteger('updateTime');
    table.bigInteger('checkTime');
    table.bigInteger('nextCheckTime');
    table.bigInteger('flow');
    table.string('status').defaultTo('checked');
  });
};

exports.createTable = createTable;
