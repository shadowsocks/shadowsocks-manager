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
    const hasAutobanTime = await knex.schema.hasColumn(tableName, 'autobanTime');
    if(!hasAutobanTime) {
      await knex.schema.table(tableName, function(table) {
        table.bigInteger('autobanTime');
      });
    }
    return;
  }
  return knex.schema.createTable(tableName, function(table) {
    table.increments('id');
    table.integer('serverId');
    table.integer('accountId');
    table.integer('port');
    table.bigInteger('updateTime');
    table.bigInteger('checkTime');
    table.bigInteger('nextCheckTime');
    table.bigInteger('autobanTime');
    table.bigInteger('flow').defaultTo(0);
    table.string('status').defaultTo('checked');
  });
};

exports.createTable = createTable;
