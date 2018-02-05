import { exec } from 'child_process';

const telegram = appRequire('plugins/webgui_telegram/index').telegram;
const isUser = appRequire('plugins/webgui_telegram/index').isUser;
const account = appRequire('plugins/account/index');
const server = appRequire('plugins/flowSaver/server');
const config = appRequire('services/config').all();
const crypto = require('crypto');
const moment = require('moment');
const qr = require('qr-image');

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

telegram.on('message', async message => {
  if(isGetAccount(message)) {
    const telegramId = message.message.chat.id.toString();
    const userId = await isUser(telegramId);
    const myAccount = await account.getAccount({ userId });
    if(!myAccount.length) {
      return telegram.emit('send', telegramId, '当前并没有分配账号');
    }
    const keyboard = myAccount.map(m => {
      return {
        text: m.port.toString(),
        callback_data: `accountId[${ m.id }]`,
      };
    });
    telegram.emit('keyboard', telegramId, '请选择账号', {
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
    telegram.emit('keyboard', telegramId, '请选择服务器', {
      inline_keyboard: serverArray,
    });
  } else if(isCallbackServer(message)) {
    const telegramId = message.callback_query.from.id.toString();
    const accountId = message.callback_query.data.match(/^accountId\[(\d{1,})\]serverId\[\d{1,}\]$/)[1];
    const serverId = message.callback_query.data.match(/^accountId\[\d{1,}\]serverId\[(\d{1,})\]$/)[1];
    const userId = await isUser(telegramId);
    const myAccount = (await account.getAccount({ userId, id: +accountId }))[0];
    const myServer = (await server.list()).filter(server => {
      return server.id === +serverId;
    })[0];
    if(!myAccount || !myServer) { return; }
    let returnMessage = '账号信息\n\n';
    const ssurl = 'ss://' + Buffer.from(`${ myServer.method }:${ myAccount.password }@${ myServer.host }:${ myAccount.port }`).toString('base64');
    returnMessage += `地址：${ myServer.host }\n端口：${ myAccount.port }\n密码：${ myAccount.password }\n加密方式：${ myServer.method }\n\n`;
    telegram.emit('send', telegramId, returnMessage);
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
      telegram.emit('send', telegramId, `过期时间：${ moment(expireTime).format('YYYY-MM-DD HH:mm') }${ isExpired }`);
    }
    await sleep(250);
    telegram.emit('markdwon', telegramId, `[${ ssurl }](${ ssurl })`);
    const qrcodeId = crypto.randomBytes(32).toString('hex');
    qrcodeObj[qrcodeId] = { url: ssurl, time: Date.now() };
    telegram.emit('photo', telegramId, `${ config.plugins.webgui.site }/api/user/telegram/qrcode/${ qrcodeId }`);
  } else if(isLogin(message)) {
    const telegramId = message.message.chat.id.toString();
    const userId = await isUser(telegramId);
    const token = crypto.randomBytes(32).toString('hex');
    tokens[token] = {
      userId: +userId,
      time: Date.now(),
    };
    telegram.emit('keyboard', telegramId, '登录', {
      inline_keyboard: [[{
        text: '点击这里登录网页版',
        url: `${ config.plugins.webgui.site }/home/login/telegram/${ token }`
      }]],
    });
    // telegram.emit('markdwon', telegramId, `[点击这里登录网页版](${ config.plugins.webgui.site }/home/login/telegram/${ token })`);
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