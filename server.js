if(process.env.NODE_ENV !== 'production') {
  console.log('use babel-core/register');
  require('babel-core/register');
}

// const Raven = require('raven');
// Raven.config('https://f54e0eb3c0ab425ab48fe67399eed90a:bc587e24e3134e528a00d52544bb481d@sentry.io/146443').install();
// Raven.captureMessage('System start.', {
//   level: 'info',
// });

require('./init/log');

const log4js = require('log4js');
const logger = log4js.getLogger('system');

logger.info('System start.');

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // Raven.captureException(reason);
});

process.on('uncaughtException', (err) => {
  logger.error(`Caught exception: ${err}`);
  // Raven.captureException(err);
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
