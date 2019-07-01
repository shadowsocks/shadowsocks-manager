const log4js = require('log4js');
const logger = log4js.getLogger('freeAccount');
const rp = require('request-promise');
const config = appRequire('services/config').all();
const cron = appRequire('init/cron');
const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const port = config.plugins.freeAccount.port;
let flow = config.plugins.freeAccount.flow;
if(flow.toString().trim().substr(-1).toUpperCase() === 'K') {
  flow = +flow.substr(0, flow.length - 1) * 1000;
}
if(flow.toString().trim().substr(-1).toUpperCase() === 'M') {
  flow = +flow.substr(0, flow.length - 1) * 1000 * 1000;
}
if(flow.toString().trim().substr(-1).toUpperCase() === 'G') {
  flow = +flow.substr(0, flow.length - 1) * 1000 * 1000 * 1000;
}
flow = +flow;
let time = config.plugins.freeAccount.time;
if(time.toString().trim().substr(-1).toUpperCase() === 'M') {
  time = +time.substr(0, time.length - 1) * 60 * 1000;
}
if(time.toString().trim().substr(-1).toUpperCase() === 'H') {
  time = +time.substr(0, time.length - 1) * 60 * 60 * 1000;
}
time = +time;
const address = config.plugins.freeAccount.address;
const method = config.plugins.freeAccount.method;
const analytics = config.plugins.freeAccount.analytics || '';
const password = config.plugins.freeAccount.password || '';

let currentPassword = '';
let updateTime = Date.now();
let currentPort = 0;
let qrcode;

const randomPort = () => {
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
  currentPort = portArray[random];
  return currentPort;
};
randomPort();

const randomPassword = () => {
  updateTime = Date.now();
  currentPassword = password + Math.random().toString().substr(2, 10);
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
    if(account.port !== currentPort) {
      manager.send({ command: 'del', port: account.port});
    }
  });
  const exists = accounts.filter(f => f.port === currentPort)[0];
  if(!exists) {
    await manager.send({ command: 'add', port: currentPort, password: randomPassword() });
    await setKey('create', { time: Date.now() });
  } else {
    logger.info('port: ' + exists.port + ', password: ' + exists.password);
    currentPassword = exists.password;
    const createTime = (await getKey('create', { time: Date.now() })).time;
    logger.info('time: ' + prettyTime(time - Date.now() + createTime) + ' left');
    if(Date.now() - createTime >= time) { changePasswordMark = true; }
    const currentFlow = (await getKey('flow', { flow: 0 })).flow;
    const newFlow = await manager.send({
      command: 'flow',
      options: {
        startTime: 0, endTime: Date.now(), clear: true
      }
    }).then(success => {
      success.forEach(f => {
        if(f.port !== currentPort) {
          manager.send({ command: 'del', port: f.port});
        }
      });
      const myFlow = success.filter(f => f.port === currentPort)[0];
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
    const ips = await manager.send({ command: 'ip', port: currentPort });
    logger.info(ips);
    if(currentFlow + newFlow >= flow) { changePasswordMark = true; }
    if(changePasswordMark) {
      await manager.send({ command: 'add', port: randomPort(), password: randomPassword() });
      await setKey('create', { time: Date.now() });
      await setKey('flow', { flow: 0 });
      qrcode = 'ss://' + Buffer.from(`${ method }:${ currentPassword }@${ address }:${ currentPort }`).toString('base64');
    }
  }
};

checkPort();
cron.minute(() => {
  checkPort();
}, 'FreeAccountCheckPort', 1);

const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.set('views', path.resolve('./plugins/freeAccount/views'));
app.set('trust proxy', 'loopback');
app.use('/libs', express.static(path.resolve('./plugins/freeAccount/libs')));
const listenPort = config.plugins.freeAccount.listen.split(':')[1];
const listenHost = config.plugins.freeAccount.listen.split(':')[0];

if(config.plugins.freeAccount.ad) {
  app.get('/ads.txt', (req, res) => {
    return res.send(`google.com, pub-${ config.plugins.freeAccount.ad.client.split('pub-')[1] }, DIRECT, f08c47fec0942fa0`);
  });
}

app.get('/', (req, res) => {
  logger.info(`[${ req.ip }] /`);
  qrcode = 'ss://' + Buffer.from(`${ method }:${ currentPassword }@${ address }:${ currentPort }`).toString('base64');
  return res.render('index', {
    recaptcha: config.plugins.freeAccount.recaptcha ? config.plugins.freeAccount.recaptcha.site : '',
    analytics,
    pay: config.plugins.freeAccount.pay,
    ad: !!config.plugins.freeAccount.ad,
    adClient: config.plugins.freeAccount.ad && config.plugins.freeAccount.ad.client,
    adSlot: config.plugins.freeAccount.ad && config.plugins.freeAccount.ad.slot,
  });
});

app.post('/qrcode', async (req, res) => {
  const token = req.body.token;
  const ip = req.ip;
  let recaptchaResult = {
    success: true,
    score: 1,
  };
  if(config.plugins.freeAccount.recaptcha) {
    recaptchaResult = await rp({
      uri: 'https://www.google.com/recaptcha/api/siteverify',
      method: 'POST',
      form: {
        secret: config.plugins.freeAccount.recaptcha.secret,
        response: token,
        remoteip: ip,
      },
      json: true,
    });
  }
  if(!recaptchaResult.success) { return res.send({
    qrcode: 'ss://invalidRequest',
    updateTime,
  }); }
  logger.info(`[${ ip }] ${ recaptchaResult.score }`);
  if(recaptchaResult.score < 0.5) {
    return res.send({
    qrcode: 'ss://invalidRequest',
    updateTime,
    score: recaptchaResult.score,
    });
  }
  res.send({ qrcode, updateTime, score: recaptchaResult.score, });
});
app.listen(listenPort, listenHost, () => {
  logger.info(`server start at ${ listenHost }:${ listenPort }`);
}).on('error', err => {
  logger.error('express server error: ' + err);
  process.exit(1);
});
