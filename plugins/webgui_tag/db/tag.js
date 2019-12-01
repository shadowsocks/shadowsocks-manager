const knex = appRequire('init/knex').knex;
const tableName = 'tag';

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) { return; }
  return knex.schema.createTable(tableName, function(table) {
    table.increments('id').primary();
    table.string('type');
    table.integer('key');
    table.string('name');
  });
};

exports.createTable = createTable;
