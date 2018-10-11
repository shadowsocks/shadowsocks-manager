if(process.env.NODE_ENV !== 'production' && require('semver').lt(process.versions.node, '8.0.0')) {
  console.log('use @babel/register');
  require('@babel/register');
}

require('./init/log');

const log4js = require('log4js');
const logger = log4js.getLogger('system');

logger.info('System start.');

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error(`Caught exception:`);
  logger.error(err);
});

require('./init/utils');

require('./init/moveConfigFile');
require('./init/checkConfig');
require('./init/knex');

const initDb = require('./init/loadModels').init;

initDb().then(() => {
  return require('./init/runShadowsocks').run();
}).then(() => {
  require('./init/loadServices');
  require('./init/loadPlugins');
}).catch(err => {
  logger.error(err);
});
