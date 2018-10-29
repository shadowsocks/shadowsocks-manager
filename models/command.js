const knex = appRequire('init/knex').knex;
const tableName = 'command';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    return;
  }
  return knex.schema.createTable(tableName, function(table) {
    table.string('code').primary();
    table.bigInteger('time');
  });
};

exports.createTable = createTable;
