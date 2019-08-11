const knex = appRequire('init/knex').knex;
const config = appRequire('services/config').all();
const tableName = 'user';

const createTable = async() => {
  const exist = await knex.schema.hasTable(tableName);
  if(!exist) {
    await knex.schema.createTable(tableName, function(table) {
      table.increments('id').primary();
      table.string('username').unique();
      table.string('email');
      table.string('telegram');
      table.string('password');
      table.string('type');
      table.bigInteger('createTime');
      table.bigInteger('lastLogin');
      table.string('resetPasswordId');
      table.bigInteger('resetPasswordTime');
      table.integer('group').defaultTo(0);
      table.string('comment').defaultTo('');
      table.string('crisp');
    });
  }
  const users = await knex('user').select(['id']);
  if(users.length === 0 && config.plugins.webgui.admin_username && config.plugins.webgui.admin_password) {
    const user = appRequire('plugins/user/index');
    await user.add({
      username: config.plugins.webgui.admin_username,
      email: config.plugins.webgui.admin_username,
      password: config.plugins.webgui.admin_password,
      type: 'admin',
      group: 0,
    });
  }
  const hasCrisp = await knex.schema.hasColumn(tableName, 'crisp');
  if(!hasCrisp) {
    await knex.schema.table(tableName, function(table) {
      table.string('crisp');
    });
  }
};

exports.createTable = createTable;
