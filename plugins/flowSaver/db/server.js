const knex = appRequire('init/knex').knex;
const tableName = 'server';
const config = appRequire('services/config').all();
const manager = appRequire('services/manager');
const log4js = require('log4js');
const logger = log4js.getLogger('flowSaver');

const createTable = async () => {
  const exist = await knex.schema.hasTable(tableName);
  if(exist) {
    const hasType = await knex.schema.hasColumn(tableName, 'type');
    if(!hasType) {
      await knex.schema.table(tableName, function(table) {
        table.string('type').defaultTo('Shadowsocks');
        table.string('key');
        table.string('net');
        table.integer('wgPort');
      });
    }
  } else {
    await knex.schema.createTable(tableName, function(table) {
      table.increments('id');
      table.string('type').defaultTo('Shadowsocks');
      table.string('name');
      table.string('host');
      table.integer('port');
      table.string('password');
      table.float('scale').defaultTo(1);
      table.string('method').defaultTo('aes-256-cfb');
      table.string('comment').defaultTo('');
      table.integer('shift').defaultTo(0);
      table.string('key');
      table.string('net');
      table.integer('wgPort');
    });
  }
  const list = await knex('server').select(['name', 'host', 'port', 'password']);
  if(list.length === 0 && config.manager) {
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
      // process.exit(1);
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
