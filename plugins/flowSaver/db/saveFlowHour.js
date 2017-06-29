const knex = appRequire('init/knex').knex;
const tableName = 'saveFlowHour';

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
    table.integer('id');
    table.integer('port');
    table.bigInteger('flow');
    table.bigInteger('time');
    table.index(['time', 'port'], 'hourIndex');
  });
};

exports.createTable = createTable;
