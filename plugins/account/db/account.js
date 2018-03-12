const knex = appRequire('init/knex').knex;
const tableName = 'account_plugin';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    const hasMultiServerFlow = await knex.schema.hasColumn(tableName, 'multiServerFlow');
    if(!hasMultiServerFlow) {
      await knex.schema.table(tableName, function(table) {
        table.integer('multiServerFlow').defaultTo(0);
      });
      const settings = JSON.parse(await knex('webguiSetting').select().where({
        key: 'account',
      }).then(s => s[0].value));
      if(settings.multiServerFlow) {
        await knex('account_plugin').update({ multiServerFlow: 1 }).where({ multiServerFlow: 0 });
      }
    }
    return;
  }
  return knex.schema.createTableIfNotExists(tableName, function(table) {
    table.increments('id');
    table.integer('type');
    table.integer('userId');
    table.string('server');
    table.integer('port').unique();
    table.string('password');
    table.string('data');
    table.integer('status');
    table.integer('autoRemove').defaultTo(0);
    table.integer('multiServerFlow').defaultTo(0);
  });
};

exports.createTable = createTable;
