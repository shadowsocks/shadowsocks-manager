const log4js = require('log4js');
const logger = log4js.getLogger('system');
const later = require('later');
const cluster = require('cluster');
const redis = appRequire('init/redis').redis;
later.date.localTime();
const sleep = time => new Promise(resolve => setTimeout(resolve, time));

const minute = function(fn, name, time = 1) {
  const fnWithRedis = async () => {
    const run = await redis.setnx(`Cron:${ name }`, 1);
    if(run) {
      redis.expire(`Cron:${ name }`, time * 60);
      logger.info(`[${ cluster.worker.id }] cron: ${ name }, [${ time * 60 }]`);
      const start = Date.now();
      await fn();
      const duration = Date.now() - start;
      if(duration < (time * 60 * 1000 / 2)) {
        await sleep(time * 60 * 1000 / 2 - duration);
      }
      await redis.del(`Cron:${ name }`);
    }
  };
  // const fnWithRedis = () => { if(isMainWorker()) { logger.info(`[${ cluster.worker.id }]cron: ${ name }, [${ time }]`); fn(); }; };
  later.setInterval(fnWithRedis, later.parse.text(`every ${ time } mins`));
};

const second = function(fn, name, time = 10) {
  const fnWithRedis = async () => {
    const run = await redis.setnx(`Cron:${ name }`, 1);
    if(run) {
      redis.expire(`Cron:${ name }`, time - 1);
      logger.info(`[${ cluster.worker.id }] cron: ${ name }, [${ time }]`);
      const start = Date.now();
      await fn();
      const duration = Date.now() - start;
      if(duration < (time * 1000 / 2)) {
        await sleep(time * 1000 / 2 - duration);
      }
      await redis.del(`Cron:${ name }`);
    }
  };
  // const fnWithRedis = () => { if(isMainWorker()) { logger.info(`[${ cluster.worker.id }]cron: ${ name }, [${ time }]`); fn(); }; };
  later.setInterval(fnWithRedis, later.parse.text(`every ${ time } seconds`));
};

const cron = function(fn, name, cronString, time) {
  const fnWithRedis = async () => {
    const run = await redis.setnx(`Cron:${ name }`, 1);
    if(run) {
      redis.expire(`Cron:${ name }`, time - 1);
      logger.info(`[${ cluster.worker.id }] cron: ${ name }, [${ time }]`);
      const start = Date.now();
      await fn();
      const duration = Date.now() - start;
      if(duration < (time * 1000 / 2)) {
        await sleep(time * 1000 / 2 - duration);
      }
      await redis.del(`Cron:${ name }`);
    }
  };
  // const fnWithRedis = () => { if(isMainWorker()) { logger.info(`[${ cluster.worker.id }]cron: ${ name }, [${ time }]`); fn(); }; };
  later.setInterval(fnWithRedis, later.parse.cron(cronString));
};

const loop = function(fn, name, time = 300, multiCore = false) {
  const fnWithRedis = async () => {
    if(multiCore) {
      while(true) {
        await sleep(1000);
        try {
          logger.info(`[${ cluster.worker.id }] cron: ${ name }, [${ time }]`);
          await fn();
        } catch(err) {
          sleep(3000 * (+process.env.numCPUs));
          logger.error(err);
        }
      }
    }
    const run = await redis.setnx(`Cron:${ name }`, 1);
    if(run) {
      await redis.expire(`Cron:${ name }`, time);
      try {
        logger.info(`[${ cluster.worker.id }] cron: ${ name }, [${ time }]`);
        await fn();
        await redis.del(`Cron:${ name }`);
        await fnWithRedis();
      } catch(err) {
        logger.error(err);
        await redis.del(`Cron:${ name }`);
        await sleep(3000 * (+process.env.numCPUs));
        await fnWithRedis();
      }
    } else {
      const ttl = await redis.ttl(`Cron:${ name }`);
      if(ttl === -1) {
        await redis.expire(`Cron:${ name }`, time);
      }
      await sleep(3000 * (+process.env.numCPUs));
      await fnWithRedis();
    }
  };
  fnWithRedis();

  // (async () => {
  //   if(multiCore || isMainWorker()) {
  //     while(true) {
  //       await sleep(1000);
  //       try {
  //         logger.info(`[${ cluster.worker.id }]cron: ${ name }, [${ time }]`);
  //         await fn();
  //       } catch(err) {
  //         sleep(3000 * (+process.env.numCPUs));
  //         logger.error(err);
  //       }
  //     }
  //   }
  // })();
};

exports.minute = minute;
exports.second = second;
exports.cron = cron;
exports.loop = loop;
