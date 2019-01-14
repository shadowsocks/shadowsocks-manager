const later = require('later');
const redis = appRequire('init/redis').redis;
later.date.localTime();
const sleep = time => new Promise(resolve => setTimeout(resolve, time));

const minute = function(fn, name, time = 1) {
  const fnWithRedis = async () => {
    const run = await redis.setnx(`Cron:${ name }`, 1);
    if(run) {
      redis.expire(`Cron:${ name }`, time * 60 - 1);
      await fn();
    }
  };
  later.setInterval(fnWithRedis, later.parse.text(`every ${ time } mins`));
};

const second = function(fn, name, time = 10) {
  const fnWithRedis = async () => {
    const run = await redis.setnx(`Cron:${ name }`, 1);
    if(run) {
      redis.expire(`Cron:${ name }`, time - 1);
      await fn();
    }
  };
  later.setInterval(fnWithRedis, later.parse.text(`every ${ time } seconds`));
};

const cron = function(fn, name, cronString, time) {
  const fnWithRedis = async () => {
    const run = await redis.setnx(`Cron:${ name }`, 1);
    if(run) {
      redis.expire(`Cron:${ name }`, time - 1);
      await fn();
    }
  };
  later.setInterval(fnWithRedis, later.parse.cron(cronString));
};

const loop = function(fn, name, time = 300, multiCore = false) {
  const fnWithRedis = async () => {
    const run = await redis.setnx(`Cron:${ name }`, 1);
    if(run) {
      redis.expire(`Cron:${ name }`, time);
      try {
        await fn();
        await redis.del(`Cron:${ name }`);
        await fnWithRedis();
      } catch(err) {
        console.log(err);
        await redis.del(`Cron:${ name }`);
        await fnWithRedis();
      }
    } else {
      sleep(3000);
      await fnWithRedis();
    }
  };
  fnWithRedis();
};

exports.minute = minute;
exports.second = second;
exports.cron = cron;
exports.loop = loop;
