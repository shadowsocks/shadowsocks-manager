module.exports = async function (ctx) {
  const knex = ctx.get('knex.client');
  const tableName = 'server';

  const config = ctx.config.all();
  if(config.empty) {
    await knex.schema.dropTableIfExists(tableName);
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.string('name');
    table.string('host');
    table.integer('port');
    table.string('password');
  });
};
