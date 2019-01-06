const knex = appRequire('init/knex').knex;
const tableName = 'webgui_telegram';

const config = appRequire('services/config').all();
const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) { return; }
  return knex.schema.createTable(tableName, function(table) {
    table.string('key');
    table.string('value');
  });
};

exports.createTable = createTable;
