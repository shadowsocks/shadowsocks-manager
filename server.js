const cluster = require('cluster');
let numCPUs = 1;
if(process.argv.indexOf('--multiCore') > 1) {
  numCPUs = require('os').cpus().length;
}
require('./init/log');
const log4js = require('log4js');
const logger = log4js.getLogger('system');
logger.info(`System start[${ process.pid }].`);

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error(`Caught exception:`);
  logger.error(err);
});

const startWorker = async () => {
  logger.info(`Worker [${ process.pid }] started`);
  require('./init/utils');

  require('./init/moveConfigFile');
  require('./init/checkConfig');
  require('./init/knex');

  const initDb = require('./init/loadModels').init;
  const runShadowsocks = require('./init/runShadowsocks').run;
  await initDb();
  await runShadowsocks();
  require('./init/loadServices');
  require('./init/loadPlugins');
  process.send('Worker start');
};

if(cluster.isMaster) {
  process.env.mainWorker = 1;
  cluster.fork();
  cluster.on('message', (worker, message, handle) => {
    if(message === 'Worker start' && Object.keys(cluster.workers).length < numCPUs) {
      cluster.fork();
    }
  });
  cluster.on('exit', (worker, code, signal) => {
    logger.error(`worker [${ worker.process.pid }][${ worker.id }] died`);
    for(w in cluster.workers) {
      process.env.mainWorker = w;
      break;
    }
    cluster.fork();
  });
} else {
  startWorker();
}
