'use strict';

const config = appRequire('services/config');

const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: config.get('db'),
  },
  useNullAsDefault: true,
});

exports.knex = knex;
