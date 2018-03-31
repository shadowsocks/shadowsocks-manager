const knex = appRequire('init/knex').knex;
const tableName = 'notice';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    const hasColumnGroup = await knex.schema.hasColumn(tableName, 'group');
    if(!hasColumnGroup) {
      await knex.schema.table(tableName, function(table) {
        table.integer('group').defaultTo(0);
      });
    }
    return;
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id').primary();
    table.string('title');
    table.string('content', 16384);
    table.bigInteger('time');
    table.integer('group').defaultTo(0);
  });
};

exports.createTable = createTable;
