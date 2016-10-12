'use strict';

require('babel-core/register');
global.Promise = require('bluebird');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

require('./init/utils');
require('./init/log');
require('./init/moveConfigFile');
require('./init/checkConfig');
require('./init/knex');

const initDb = require('./init/loadModels').init;

initDb().then(() => {
  require('./init/loadServices');
  require('./init/loadPlugins');
}).catch(err => {
  console.log(err);
});
