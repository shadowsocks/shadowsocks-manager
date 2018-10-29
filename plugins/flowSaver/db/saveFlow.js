const knex = appRequire('init/knex').knex;
const tableName = 'saveFlow';

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    await knex.schema.table(tableName, function(table) {
      table.index('id');
      table.index('accountId');
    });
    const hasColumnAccountId = await knex.schema.hasColumn(tableName, 'accountId');
    if(!hasColumnAccountId) {
      await knex.schema.table(tableName, function(table) {
        table.integer('accountId').defaultTo(0);
      });
    }
    return;
  }
  return knex.schema.createTable(tableName, function(table) {
    table.integer('id');
    table.integer('accountId').defaultTo(0);
    table.integer('port');
    table.bigInteger('flow');
    table.bigInteger('time');
    table.index(['time', 'port'], 'index');
    table.index('id');
    table.index('accountId');
  });
};

exports.createTable = createTable;
