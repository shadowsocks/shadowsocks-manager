const log4js = require('log4js');
const logger = log4js.getLogger('freeAccount');

const config = appRequire('services/config').all();
const cron = appRequire('init/cron');
const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const port = config.plugins.freeAccount.port;
const flow = config.plugins.freeAccount.flow;
const time = config.plugins.freeAccount.time;
const address = config.plugins.freeAccount.address;
const method = config.plugins.freeAccount.method;

let currentPassword = '';

const randomPassword = () => {
  currentPassword = Math.random().toString().substr(2, 10);
  return currentPassword;
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

const getKey = async (key, defaultValue) => {
  try {
    const result = await knex('freeAccount').select().where({
      key
    }).then(success => success[0]);
    return JSON.parse(result.value);
  } catch (err) {
    await knex('freeAccount').insert({
      key,
      value: JSON.stringify(defaultValue)
    });
    return getKey(key);
  }
};

const setKey = async (key, value) => {
  try {
    await getKey(key);
    await knex('freeAccount').update({
      value: JSON.stringify(value)
    }).where({
      key
    });
  } catch (err) {
    await knex('freeAccount').insert({
      key,
      value: JSON.stringify(value)
    });
  }
};

const checkPort = async () => {
  let changePasswordMark = false;
  const accounts = await manager.send({ command: 'list' });
  accounts.forEach(account => {
    if(account.port !== port) {
      manager.send({ command: 'del', port: account.port});
    }
  });
  const exists = accounts.filter(f => f.port === port)[0];
  if(!exists) {
    await manager.send({ command: 'add', port, password: randomPassword() });
    await setKey('create', { time: Date.now() });
  } else {
    logger.info('port: ' + exists.port + ', password: ' + exists.password);
    currentPassword = exists.password;
    const createTime = (await getKey('create', { time: Date.now() })).time;
    if(Date.now() - createTime >= time) { changePasswordMark = true; }
    const currentFlow = (await getKey('flow', { flow: 0 })).flow;
    const newFlow = await manager.send({
      command: 'flow',
      options: {
        startTime: 0, endTime: Date.now(), clear: true
      }
    }).then(success => {
      success.forEach(f => {
        if(f.port !== port) {
          manager.send({ command: 'del', port: f.port});
        }
      });
      const myFlow = success.filter(f => f.port === port)[0];
      if(myFlow) {
        return myFlow.sumFlow;
      } else {
        return 0;
      }
    });
    logger.info('flow: ' + prettyFlow(currentFlow + newFlow) + '/' + prettyFlow(flow) + ' ' + Math.ceil((currentFlow + newFlow) * 100/flow) + '%');
    await setKey('flow', { flow: currentFlow + newFlow });
    const sumFlow = (await getKey('sumFlow', { flow: 0 })).flow;
    await setKey('sumFlow', { flow: sumFlow + newFlow });
    logger.info('sumFlow: ' + prettyFlow(sumFlow + newFlow));
    const ips = await manager.send({ command: 'ip', port });
    logger.info(ips);
    if(currentFlow + newFlow >= flow) { changePasswordMark = true; }
    if(changePasswordMark) {
      await manager.send({ command: 'pwd', port, password: randomPassword() });
      await setKey('create', { time: Date.now() });
      await setKey('flow', { flow: 0 });
    }
  }
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
app.set('views', path.resolve('./plugins/freeAccount/views'));
app.use('/libs', express.static(path.resolve('./plugins/freeAccount/libs')));
const listenPort = config.plugins.freeAccount.listen.split(':')[1];
const listenHost = config.plugins.freeAccount.listen.split(':')[0];
app.get('/', (req, res) => {
  return res.render('index', {
    qrcode: 'ss://' + Buffer.from(`${ method }:${ currentPassword }@${ address }:${ port }`).toString('base64')
  });
});
app.listen(listenPort, listenHost, () => {
  logger.info(`server start at ${ listenHost }:${ listenPort }`);
}).on('error', err => {
  logger.error('express server error: ' + err);
  process.exit(1);
});