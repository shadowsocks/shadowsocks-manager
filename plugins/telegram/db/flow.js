const knex = appRequire('init/knex').knex;
const tableName = 'saveFlow';

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    return;
  }
  return knex.schema.createTable(tableName, function(table) {
    table.integer('id');
    table.integer('port');
    table.bigInteger('flow');
    table.bigInteger('time');
    table.index(['time', 'port'], 'index');
  });
};

exports.createTable = createTable;
