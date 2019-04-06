const knex = appRequire('init/knex').knex;
const tableName = 'notice';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    const hasAutopop = await knex.schema.hasColumn(tableName, 'autopop');
    if(!hasAutopop) {
      await knex.schema.table(tableName, function(table) {
        table.integer('autopop').defaultTo(0);
      });
    }
    await knex(tableName).update({
      group: 0
    }).whereNotIn('group', [0, 1]);
    return;
  }
  return knex.schema.createTable(tableName, function(table) {
    table.increments('id').primary();
    table.string('title');
    table.string('content', 16384);
    table.bigInteger('time');
    table.integer('group').defaultTo(0);
    table.integer('autopop').defaultTo(0);
  });
};

exports.createTable = createTable;
