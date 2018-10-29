const knex = appRequire('init/knex').knex;
const tableName = 'push';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    const hasUserId = await knex.schema.hasColumn(tableName, 'userId');
    if(!hasUserId) {
      await knex.schema.table(tableName, function(table) {
        table.integer('userId').defaultTo(1);
      });
    }
    return;
  }
  return knex.schema.createTable(tableName, function(table) {
    table.increments('id').primary();
    table.integer('userId').defaultTo(1);
    table.string('endpoint').unique();
    table.string('auth');
    table.string('p256dh');
  });
};

exports.createTable = createTable;
