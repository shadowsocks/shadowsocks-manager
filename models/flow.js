const knex = appRequire('init/knex').knex;
const tableName = 'flow';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    return;
  }
  return knex.schema.createTable(tableName, function(table) {
    table.integer('port');
    table.integer('flow');
    table.bigInteger('time');
  });
};

exports.createTable = createTable;
