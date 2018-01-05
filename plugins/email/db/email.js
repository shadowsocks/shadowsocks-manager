const knex = appRequire('init/knex').knex;
const tableName = 'email';

const createTable = async() => {
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.string('to');
    table.string('subject');
    table.string('text', 16384);
    table.string('type');
    table.string('remark');
    table.string('ip');
    table.string('session');
    table.bigInteger('time');
  });
};

exports.createTable = createTable;
