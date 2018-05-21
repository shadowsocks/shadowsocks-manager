const tg = appRequire('plugins/webgui_telegram/index');
const telegram = appRequire('plugins/webgui_telegram/index').telegram;
const isUser = appRequire('plugins/webgui_telegram/index').isUser;
const account = appRequire('plugins/account/index');
const server = appRequire('plugins/flowSaver/server');
const config = appRequire('services/config').all();
const crypto = require('crypto');
const moment = require('moment');
const qr = require('qr-image');
const flow = appRequire('plugins/flowSaver/flow');
const knex = appRequire('init/knex').knex;

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

const sleep = time => {
  return new Promise(resolve => {
    setTimeout(() => { resolve(); }, time);
  });
};

const isLogin = message => {
  if(!message.message || !message.message.text) { return false; }
  if(!message.message || !message.message.chat || !message.message.chat.type === 'private') { return false; }
  if(message.message.text.trim() !== 'login') { return false; }
  return true;
};

const isGetAccount = message => {
  if(!message.message || !message.message.text) { return false; }
  if(!message.message || !message.message.chat || !message.message.chat.type === 'private') { return false; }
  if(message.message.text.trim() !== 'account') { return false; }
  return true;
};

const isCallbackAccount = message => {
  if(!message.callback_query || !message.callback_query.data) { return false; }
  if(!message.callback_query.data.match(/^accountId\[\d{1,}\]$/)) {
    return false;
  }
  return true;
};

const isCallbackServer = message => {
  if(!message.callback_query || !message.callback_query.data) { return false; }
  if(!message.callback_query.data.match(/^accountId\[\d{1,}\]serverId\[\d{1,}\]$/)) {
    return false;
  }
  return true;
};

const isCallbackPay = message => {
  if(!message.callback_query || !message.callback_query.data) { return false; }
  if(!message.callback_query.data.match(/^alipay:accountId\[\d{1,}\]$/)) {
    return false;
  }
  return true;
};
const isCallbackPayQrcode = message => {
  if(!message.callback_query || !message.callback_query.data) { return false; }
  if(!message.callback_query.data.match(/^alipay:qrcode:accountId\[\d{1,}\]type\[[a-z]{1,}\]$/)) {
    return false;
  }
  return true;
};

telegram.on('message', async message => {
  if(isGetAccount(message)) {
    const telegramId = message.message.chat.id.toString();
    const userId = await isUser(telegramId);
    const myAccount = await account.getAccount({ userId });
    if(!myAccount.length) {
      tg.sendMessage('当前并没有分配账号', telegramId);
      if(config.plugins.alipay && config.plugins.alipay.use) {
        tg.sendKeyboard('续费', telegramId, {
          inline_keyboard: [[{
            text: '点击这里续费',
            callback_data: `alipay:accountId[0]`,
          }]],
        });
      }
      return;
    }
    const keyboard = myAccount.map(m => {
      return {
        text: m.port.toString(),
        callback_data: `accountId[${ m.id }]`,
      };
    });
    tg.sendKeyboard('请选择账号', telegramId, {
      inline_keyboard: [
        keyboard
      ],
    });
  } else if(isCallbackAccount(message)) {
    const telegramId = message.callback_query.from.id.toString();
    const accountId = message.callback_query.data.match(/^accountId\[(\d{1,})\]$/)[1];
    const userId = await isUser(telegramId);
    const myAccount = (await account.getAccount({ userId, id: +accountId }))[0];
    if(!myAccount) { return; }
    let servers = await server.list();
    const validServers = JSON.parse(myAccount.server);
    servers = servers.filter(f => {
      if(!validServers) {
        return true;
      } else {
        return validServers.indexOf(f.id) >= 0;
      }
    });
    let row = 4;
    if(servers.length <= 4) {
      row = 2;
    } else if (servers.length <= 9) {
      row = 3;
    }
    const serverArray = [];
    servers.forEach((server, index) => {
      if(index % row === 0) {
        serverArray.push([]);
      }
      serverArray[serverArray.length -1].push({
        text: server.name,
        callback_data: `accountId[${ myAccount.id }]serverId[${ server.id }]`,
      });
    });
    if(serverArray.length > 1 && serverArray[serverArray.length - 1].length < row) {
      '----'.substr(0, row - serverArray[serverArray.length - 1].length).split('').forEach(f => {
        serverArray[serverArray.length -1].push({
          text: f,
          callback_data: ' ',
        });
      });
    }
    tg.sendKeyboard('请选择服务器', telegramId, {
      inline_keyboard: serverArray,
    });
    if(myAccount.type >= 2 && myAccount.type <= 5 && config.plugins.alipay && config.plugins.alipay.use) {
      tg.sendKeyboard('续费', telegramId, {
        inline_keyboard: [[{
          text: '点击这里续费',
          callback_data: `alipay:accountId[${ myAccount.id }]`,
        }]],
      });
    }
  } else if(isCallbackServer(message)) {
    const telegramId = message.callback_query.from.id.toString();
    const accountId = message.callback_query.data.match(/^accountId\[(\d{1,})\]serverId\[\d{1,}\]$/)[1];
    const serverId = message.callback_query.data.match(/^accountId\[\d{1,}\]serverId\[(\d{1,})\]$/)[1];
    const userId = await isUser(telegramId);
    const myAccount = (await account.getAccount({ userId, id: +accountId }))[0];
    const myServer = (await server.list()).filter(server => {
      return server.id === +serverId;
    }).map(server => {
      if(server.host.indexOf(':') >= 0) {
        const hosts = server.host.split(':');
        const number = Math.ceil(Math.random() * (hosts.length - 1));
        server.host = hosts[number];
      }
      return server;
    })[0];
    if(!myAccount || !myServer) { return; }
    let returnMessage = '账号信息\n\n';
    const ssurl = 'ss://' + Buffer.from(`${ myServer.method }:${ myAccount.password }@${ myServer.host }:${ myAccount.port }`).toString('base64');
    returnMessage += `地址：${ myServer.host }\n端口：${ myAccount.port }\n密码：${ myAccount.password }\n加密方式：${ myServer.method }\n\n`;
    tg.sendMessage(returnMessage, telegramId);
    if(myAccount.type >= 2 && myAccount.type <= 5) {
      
      let timePeriod = 0;
      if(myAccount.type === 2) { timePeriod = 7 * 86400 * 1000; }
      if(myAccount.type === 3) { timePeriod = 30 * 86400 * 1000; }
      if(myAccount.type === 4) { timePeriod = 1 * 86400 * 1000; }
      if(myAccount.type === 5) { timePeriod = 3600 * 1000; }
      const data = JSON.parse(myAccount.data);
      const expireTime = data.create + data.limit * timePeriod;
      await sleep(250);
      const isExpired = Date.now() >= expireTime ? ' [已过期]' : '';

      const time = {
        '2': 7 * 24 * 3600000,
        '3': 30 * 24 * 3600000,
        '4': 24 * 3600000,
        '5': 3600000,
      };
      const timeArray = [data.create, data.create + time[myAccount.type]];
      if (data.create <= Date.now()) {
        let i = 0;
        while (data.create + i * time[myAccount.type] <= Date.now()) {
          timeArray[0] = data.create + i * time[myAccount.type];
          timeArray[1] = data.create + (i + 1) * time[myAccount.type];
          i++;
        }
      }
      const flowLimit = data.flow * (myAccount.isMultiServerFlow ? 1 : myServer.scale);
      const currentFlow = (await flow.getServerPortFlow(myServer.id, myAccount.id, timeArray, myAccount.multiServerFlow))[0];
      tg.sendMessage(`流量：${ prettyFlow(currentFlow) } / ${ prettyFlow(flowLimit) }`, telegramId);
      tg.sendMessage(`过期时间：${ moment(expireTime).format('YYYY-MM-DD HH:mm') }${ isExpired }`, telegramId);
    }
    await sleep(250);
    tg.sendMarkdown(`[${ ssurl }](${ ssurl })`, telegramId);
    const qrcodeId = crypto.randomBytes(32).toString('hex');
    qrcodeObj[qrcodeId] = { url: ssurl, time: Date.now() };
    tg.sendPhoto(`${ config.plugins.webgui.site }/api/user/telegram/qrcode/${ qrcodeId }`, telegramId);
  } else if(isLogin(message)) {
    const telegramId = message.message.chat.id.toString();
    const userId = await isUser(telegramId);
    const token = crypto.randomBytes(32).toString('hex');
    tokens[token] = {
      userId: +userId,
      time: Date.now(),
    };
    tg.sendKeyboard('登录', telegramId, {
      inline_keyboard: [[{
        text: '点击这里登录网页版',
        url: `${ config.plugins.webgui.site }/home/login/telegram/${ token }`
      }]],
    });
  } else if(isCallbackPay(message)) {
    const telegramId = message.callback_query.from.id.toString();
    const accountId = +message.callback_query.data.match(/^alipay:accountId\[(\d{1,})\]$/)[1];
    let paymentInfo = await knex('webguiSetting').select().where({
      key: 'payment',
    }).then(s => s[0]);
    if(!paymentInfo) { return; }
    paymentInfo = JSON.parse(paymentInfo.value);
    const paymentArray = [];
    for(let pi in paymentInfo) {
      if(paymentInfo[pi].alipay > 0) {
        paymentArray.push([{
          text: `${ paymentInfo[pi].orderName } ${ paymentInfo[pi].alipay }`,
          callback_data: `alipay:qrcode:accountId[${ accountId }]type[${ pi }]`,
        }]);
      }
    }
    tg.sendKeyboard('选择续费类型：', telegramId, {
      inline_keyboard: paymentArray,
    });
  } else if(isCallbackPayQrcode(message)) {
    const alipay = appRequire('plugins/alipay/index');
    let paymentInfo = await knex('webguiSetting').select().where({
      key: 'payment',
    }).then(s => s[0]);
    if(!paymentInfo) { return; }
    paymentInfo = JSON.parse(paymentInfo.value);
    const payType = {
      hour: 5,
      day: 4,
      week: 2,
      month: 3,
      season: 6,
      year: 7,
    };
    const telegramId = message.callback_query.from.id.toString();
    const accountId = +message.callback_query.data.match(/^alipay:qrcode:accountId\[(\d{1,})\]type\[[a-z]{1,}\]$/)[1];
    const type = message.callback_query.data.match(/^alipay:qrcode:accountId\[\d{1,}\]type\[([a-z]{1,})\]$/)[1];
    const amount = paymentInfo[type].alipay + '';
    const userId = (await tg.getUserStatus(telegramId)).id;
    const payInfo = await alipay.createOrder(userId, accountId > 0 ? accountId : null, amount, payType[type]);
    const qrcodeId = crypto.randomBytes(32).toString('hex');
    qrcodeObj[qrcodeId] = { url: payInfo.qrCode, time: Date.now() };
    tg.sendMarkdown(`请用支付宝扫描下面二维码完成支付\n\n或者 [点击此链接](${ payInfo.qrCode }) 跳转到支付宝支付`, telegramId);
    tg.sendPhoto(`${ config.plugins.webgui.site }/api/user/telegram/qrcode/${ qrcodeId }`, telegramId);
  }
});

const qrcodeObj = {};

const qrcode = (req, res) => {
  for(const i in qrcodeObj) {
    if(Date.now() - qrcodeObj[i].time >= 5 * 60 * 1000) {
      delete qrcodeObj[i];
    }
  }
  const id = req.params.qrcodeId;
  const code = qr.image(qrcodeObj[id].url, { type: 'png', size: 7 });
  res.setHeader('Content-type', 'image/png');
  code.pipe(res);
};

const tokens = {};

const login = (req, res) => {
  delete req.session.user;
  delete req.session.type;
  const token = req.body.token;
  for(const t in tokens) {
    if(Date.now() - tokens[t].time > 5 * 60 * 1000) {
      delete tokens[t];
    }
  }
  if(tokens[token] && Date.now() - tokens[token].time <= 5 * 60 * 1000) {
    req.session.user = tokens[token].userId;
    req.session.type = 'normal';
    req.session.save();
    return res.send('success');
  } else {
    return res.status(403).end();
  }
};

exports.qrcode = qrcode;
exports.login = login;