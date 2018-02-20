const knex = appRequire('init/knex').knex;
const tableName = 'affiliates';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    return;
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id').primary();
    table.string('registeringIpAddress');
    table.integer('registeringUserId');
    table.bigInteger('registeringDatetime');
    table.integer('referrerUserId');
    table.bigInteger('flow');
    table.integer('duration');
  });
};

exports.createTable = createTable;
