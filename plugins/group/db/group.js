const knex = appRequire('init/knex').knex;
const tableName = 'group';

const addDefaultGroup = async () => {
  const data = await knex('group')
    .where({ id: 0 })
    .then(s => s[0]);
  if (!data) {
    const id = await knex('group').insert(
      { id: 0, name: '默认组', comment: '系统默认分组' },
    );
    if (id[0] !== 0) {
      await knex('group')
        .update({ id: 0 })
        .where({ id: id[0] });
    }
  }
  return;
};

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if (exist) {
    await addDefaultGroup();
    const hasShowNotice = await knex.schema.hasColumn(tableName, 'showNotice');
    if(hasShowNotice) {
      await knex.schema.table(tableName, function(table) {
        table.dropColumn('showNotice');
      });
    }
    return;
  }
  await knex.schema.createTable(tableName, function(table) {
    table.increments('id');
    table.string('name');
    table.string('comment');
    table.string('order');
    table.integer('multiAccount').defaultTo(0);
  });
  await addDefaultGroup();
  return;
};

exports.createTable = createTable;
