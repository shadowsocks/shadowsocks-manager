const config = appRequire('services/config').get('db');

let knex;
if(typeof config === 'object') {
  const { host, user, password, database, port } = config;
  knex = require('knex')({
    client: 'mysql',
    connection: {
      host,
      user,
      port,
      password,
      database,
      charset: 'utf8',
      collate: 'utf8_unicode_ci',
    },
    useNullAsDefault: true,
  });
} else {
  knex = require('knex')({
    client: 'sqlite3',
    connection: {
      filename: config,
    },
    useNullAsDefault: true,
  });
}


exports.knex = knex;
