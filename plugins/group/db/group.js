const knex = appRequire('init/knex').knex;
const tableName = 'group';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    return;
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id');
    table.string('name');
    table.string('comment');
  });
};

exports.createTable = createTable;
