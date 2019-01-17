const knex = appRequire('init/knex').knex;
const tableName = 'webgui_ref_code';

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) { return; }
  return knex.schema.createTable(tableName, function(table) {
    table.increments('id').primary();
    table.string('code').unique();
    table.integer('sourceUserId');
    table.integer('visit').defaultTo(0);
    table.integer('maxUser').defaultTo(3);
    table.bigInteger('time');
  });
};

exports.createTable = createTable;
