const cluster = require('cluster');
if(!process.env.numCPUs) {
  process.env.numCPUs = 1;
}
if(process.argv.indexOf('--multiCore') > 1) {
  process.env.numCPUs = require('os').cpus().length;
}
require('./init/log');
const log4js = require('log4js');
const logger = log4js.getLogger('system');
if(cluster.isMaster) {
  logger.info(`System start[${ process.pid }].`);
} else {
  logger.info(`Worker start[${ process.pid }].`);
}

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error(`Caught exception:`);
  logger.error(err);
});

const startWorker = async () => {
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
    if(message === 'Worker start' && Object.keys(cluster.workers).length < (+process.env.numCPUs)) {
      cluster.fork();
    }
  });
  cluster.on('exit', (worker, code, signal) => {
    if(code === 0) { return; }
    logger.error(`worker [${ worker.process.pid }][${ worker.id }] died`);
    for(const w in cluster.workers) {
      process.env.mainWorker = w;
      break;
    }
    cluster.fork();
  });
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.on('line', input => {
    if(input === 'rs') {
      for(const w in cluster.workers) {
        cluster.workers[w].kill();
        break;
      }
    }
  });
} else {
  startWorker();
}


