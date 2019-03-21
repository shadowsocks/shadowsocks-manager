const knex = appRequire('init/knex').knex;
const tableName = 'account_flow';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    await knex.schema.table(tableName, function(table) {
      table.index('id');
      table.index(['serverId', 'accountId']);
      table.index('updateTime');
      table.index('checkTime');
      table.index('nextCheckTime');
      table.index('checkFlowTime');
    });
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
    table.bigInteger('checkFlowTime').defaultTo(Date.now());
    table.bigInteger('autobanTime');
    table.bigInteger('flow').defaultTo(0);
    table.string('status').defaultTo('checked');

    table.index('id');
    table.index(['serverId', 'accountId']);
    table.index('updateTime');
    table.index('checkTime');
    table.index('nextCheckTime');
    table.index('checkFlowTime');
  });
};

exports.createTable = createTable;
