const knex = appRequire('init/knex').knex;
const tableName = 'server';
const config = appRequire('services/config').all();
const manager = appRequire('services/manager');
const log4js = require('log4js');
const logger = log4js.getLogger('flowSaver');

const createTable = async () => {
  const hasTable = await knex.schema.hasTable(tableName);
  if(!hasTable) {
    await knex.schema.createTable(tableName, function(table) {
      table.increments('id');
      table.string('name');
      table.string('host');
      table.integer('port');
      table.string('password');
      table.float('scale').defaultTo(1);
      table.string('method').defaultTo('aes-256-cfb');
      table.string('comment').defaultTo('');
      table.integer('shift').defaultTo(0);
    });
  }
  const list = await knex('server').select(['name', 'host', 'port', 'password']);
  if(list.length === 0) {
    const host = config.manager.address.split(':')[0];
    const port = +config.manager.address.split(':')[1];
    const password = config.manager.password;
    await manager.send({
      command: 'flow',
      options: {
        clear: false,
      },
    }, {
      host,
      port,
      password,
    }).catch(() => {
      logger.error(`connect to server ${ password }@${ host }:${ port } fail.`);
      process.exit(1);
    });
    await knex('server').insert({
      name: 'default',
      host,
      port,
      password,
    });
  }
  return;
};

exports.createTable = createTable;
