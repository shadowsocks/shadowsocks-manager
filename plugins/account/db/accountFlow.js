const knex = appRequire('init/knex').knex;
const tableName = 'account_flow';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    const hasCheckFlowTime = await knex.schema.hasColumn(tableName, 'checkFlowTime');
    if(!hasCheckFlowTime) {
      await knex.schema.table(tableName, function(table) {
        table.bigInteger('checkFlowTime').defaultTo(Date.now());
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
