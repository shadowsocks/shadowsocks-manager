const log4js = require('log4js');
const logger = log4js.getLogger('freeAccount');
const rp = require('request-promise');
const config = appRequire('services/config').all();
const cron = appRequire('init/cron');
const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const port = config.plugins.freeAccountMiner.port;
const speed = config.plugins.freeAccountMiner.speed;
const publicKey = config.plugins.freeAccountMiner.public;
const privateKey = config.plugins.freeAccountMiner.private;
const analytics = config.plugins.freeAccountMiner.analytics;
const address = config.plugins.freeAccountMiner.address;
const method = config.plugins.freeAccountMiner.method;
const timeout = 60 * 60 * 1000;
const price = {
  flow: config.plugins.freeAccountMiner.price.flow,
  time: config.plugins.freeAccountMiner.price.time,
};

const randomPort = async () => {
  const portString = port.toString();
  const portArray = [];
  portString.split(',').forEach(f => {
    if(f.indexOf('-') < 0) {
      portArray.push(+f);
    } else {
      const start = f.split('-')[0];
      const end = f.split('-')[1];
      for(let p = +start; p <= +end; p++) {
        portArray.push(p);
      }
    }
  });
  const random = Math.floor(Math.random() * portArray.length);
  const isExists = await knex('port').where({ port: portArray[random] }).then(s => s[0]);
  if(isExists) {
    return await randomPort();
  }
  return portArray[random];
};

const randomPassword = () => {
  return Math.random().toString().substr(2, 10);
};

const prettyFlow = number => {
  if(number >= 0 && number < 1000) {
    return number + ' B';
  } else if(number >= 1000 && number < 1000 * 1000) {
    return (number / 1000).toFixed(1) + ' KB';
  } else if(number >= 1000 * 1000 && number < 1000 * 1000 * 1000) {
    return (number / (1000 * 1000)).toFixed(2) + ' MB';
  } else if(number >= 1000 * 1000 * 1000 && number < 1000 * 1000 * 1000 * 1000) {
    return (number / (1000 * 1000 * 1000)).toFixed(3) + ' GB';
  } else if(number >= 1000 * 1000 * 1000 * 1000 && number < 1000 * 1000 * 1000 * 1000 * 1000) {
    return (number / (1000 * 1000 * 1000 * 1000)).toFixed(3) + ' TB';
  } else {
    return number + '';
  }
};

const prettyTime = number => {
  const numberOfSecond = Math.ceil(number/1000);
  if(numberOfSecond >= 0 && numberOfSecond < 60) {
    return numberOfSecond + 's';
  } else if (numberOfSecond >= 60 && numberOfSecond < 3600) {
    return Math.floor(numberOfSecond/60) + 'm' + (numberOfSecond%60) + 's';
  } else if (numberOfSecond >= 3600) {
    const hour = Math.floor(numberOfSecond/3600);
    const min = Math.floor((numberOfSecond - 3600 * hour)/60);
    const sec = (numberOfSecond - 3600 * hour) % 60;
    return hour + 'h' + min + 'm' + sec + 's';
  } else {
    return numberOfSecond + 's';
  }
};

const getKey = async (key, defaultValue) => {
  try {
    const result = await knex('freeAccountMiner').select().where({
      key
    }).then(success => success[0]);
    return JSON.parse(result.value);
  } catch (err) {
    await knex('freeAccountMiner').insert({
      key,
      value: JSON.stringify(defaultValue)
    });
    return getKey(key);
  }
};

const setKey = async (key, value) => {
  try {
    await getKey(key);
    await knex('freeAccountMiner').update({
      value: JSON.stringify(value)
    }).where({
      key
    });
  } catch (err) {
    await knex('freeAccountMiner').insert({
      key,
      value: JSON.stringify(value)
    });
  }
};

const checkPort = async () => {
  const isOutOfPrice = port => {
    const left = port.balance - (Date.now() - port.create) / 1000 * price.time - port.flow * price.flow;
    return left <= 0;
  };
  const accounts = await manager.send({ command: 'list' });
  const ports = await knex('port').select();
  ports.forEach(port => {
    const time = +port.user.substr(0, 13);
    if(Date.now() - time >= timeout) {
      knex('port').delete().where({ user: port.user }).then();
    }
    const exists = accounts.filter(f => f.port === port.port)[0];
    if(!exists && !isOutOfPrice(port)) {
      manager.send({ command: 'add', port: port.port, password: port.password });
    }
    if(exists && isOutOfPrice(port)) {
      manager.send({ command: 'del', port: port.port });
    }
  });
  accounts.forEach(account => {
    const exists = ports.filter(f => f.port === account.port)[0];
    if(!exists) {
      manager.send({ command: 'del', port: account.port});
    }
  });
  await manager.send({
    command: 'flow',
    options: {
      startTime: 0, endTime: Date.now(), clear: true
    }
  }).then(success => {
    success.filter(f => f.sumFlow > 0).forEach(account => {
      console.log(account);
      const exists = ports.filter(f => f.port === account.port)[0];
      if(!exists) {
        manager.send({ command: 'del', port: account.port});
      } else if(isOutOfPrice(exists)) {
        manager.send({ command: 'del', port: account.port});
      } else {
        knex('port').where({ port: account.port }).then(success => {
          if(!success[0]) { return; }
          return knex('port').update({
            flow: account.sumFlow + success[0].flow,
          }).where({ port: account.port });
        });
      }
    });
  });
};

const getMine = async user => {
  return rp({
    method: 'GET',
    uri: 'https://api.coinhive.com/user/balance',
    qs: {
      secret: privateKey,
      name: user,
    },
    simple: false,
  }).then(s => JSON.parse(s));
};

const checkUser = async user => {
  const time = +user.substr(0, 13);
  if(Date.now() - time >= timeout) {
    await knex('port').delete().where({ user });
    return {
      status: -1
    };
  }
  const mineData = await getMine(user);
  if(mineData.success) {
    const exists = await knex('port').where({ user }).then(s => s[0]);
    if(exists) {
      await knex('port').update({
        balance: mineData.balance,
      }).where({ user });
    } else {
      await knex('port').insert({
        user,
        create: Date.now(),
        flow: 0,
        balance: mineData.balance,
        port: await randomPort(),
        password: randomPassword(),
      });
    }
  } else {
    return {
      ststus: -2
    };
  }
  return knex('port').where({ user }).then(s => {
    let flowLeft = +((s[0].balance - (Date.now() - s[0].create) / 1000 * price.time - s[0].flow * price.flow) / price.flow).toFixed(0);
    if(flowLeft < 0) { flowLeft = 0; }
    return {
      status: 0,
      qrcode: 'ss://' + Buffer.from(`${ method }:${ s[0].password }@${ address }:${ s[0].port }`).toString('base64'),
      flow: prettyFlow(s[0].flow),
      flowLeft: prettyFlow(flowLeft),
    };
  });
};

checkPort();
cron.minute(() => {
  checkPort();
}, 1);

const path = require('path');
const express = require('express');
const app = express();
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.set('views', path.resolve('./plugins/freeAccountMiner/views'));
app.set('trust proxy', 'loopback');
app.use('/libs', express.static(path.resolve('./plugins/freeAccountMiner/libs')));
const listenPort = config.plugins.freeAccountMiner.listen.split(':')[1];
const listenHost = config.plugins.freeAccountMiner.listen.split(':')[0];
app.get('/', (req, res) => {
  logger.info(`[${ req.ip }] /`);
  return res.render('index', {
    publicKey,
    analytics,
    speed: speed >= 0.5 ? 0.5 : +(1 - speed).toFixed(2)
  });
});

app.get('/account', (req, res) => {
  const user = req.query.user;
  checkUser(user).then(success => {
    return res.send(success);
  });
});

app.listen(listenPort, listenHost, () => {
  logger.info(`server start at ${ listenHost }:${ listenPort }`);
}).on('error', err => {
  logger.error('express server error: ' + err);
  process.exit(1);
});