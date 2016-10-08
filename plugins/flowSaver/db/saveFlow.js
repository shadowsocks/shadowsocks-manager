module.exports = async function (ctx) {
  const knex = ctx.get('knex.client');
  const tableName = 'saveFlow';

  const config = ctx.config.all();
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.string('name');
    table.integer('port');
    table.integer('flow');
    table.dateTime('time');
  });
};
