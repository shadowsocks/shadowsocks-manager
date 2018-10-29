const knex = appRequire('init/knex').knex;
const tableName = 'email';

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    const hasTelegramId = await knex.schema.hasColumn(tableName, 'telegramId');
    if(!hasTelegramId) {
      await knex.schema.table(tableName, function(table) {
        table.string('telegramId');
      });
    }
    return;
  }
  return knex.schema.createTable(tableName, function(table) {
    table.string('to');
    table.string('subject');
    table.string('text', 16384);
    table.string('type');
    table.string('remark');
    table.string('ip');
    table.string('session');
    table.string('telegramId');
    table.bigInteger('time');
  });
};

exports.createTable = createTable;
