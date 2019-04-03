const knex = appRequire('init/knex').knex;
const tableName = 'notice_group';

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if (exist) { return; }
  await knex.schema.createTable(tableName, function(table) {
    table.increments('id');
    table.integer('noticeId');
    table.integer('groupId');
  });
  return;
};

exports.createTable = createTable;
