const telegram = appRequire('plugins/webgui_telegram/index').telegram;
const getMe = appRequire('plugins/webgui_telegram/index').getMe;
const knex = appRequire('init/knex').knex;
const user = appRequire('plugins/user/index');

const isUserBindMessage = message => {
  if(!message.message || !message.message.text) { return false; }
  if(!message.message || !message.message.chat || !message.message.chat.type === 'private') { return false; }
  if(!message.message.text.trim().match(/^\d{8}$/)) { return false; }
  return true;
};

const codes = {};
let fails = [];

telegram.on('message', message => {
  if(isUserBindMessage(message)) {
    let isFailed = true;
    const telegramId = message.message.chat.id.toString();
    fails = fails.filter(f => { return Date.now() - f.time <= 10 * 60 * 1000; });
    if(fails.filter(f => { return f.id === telegramId; }).length >= 10) {
      console.log('telegram id is blocked in 10 mins');
      return;
    }
    for(const code in codes) {
      if(codes[code].code === message.message.text.trim()) {
        isFailed = false;
        bindUser(code, message);
      }
    }
    if(isFailed) {
      fails.push({ id: telegramId, time: Date.now() });
    }
  }
});

const bindUser = async (userId, message) => {
  const telegramId = message.message.chat.id.toString();
  if(!telegramId) {
    return Promise.reject('');
  }
  const exists = await knex('user').where({
    telegram: telegramId
  }).then(success => success[0]);
  if(exists) {
    return Promise.reject('');
  }
  await user.edit({ id: userId }, { telegram: telegramId });
  telegram.emit('reply', message, 'Telegram账号绑定成功，输入 help 查看使用方法');
};

const unbindUser = async (userId) => {
  const exists = await knex('user').where({
    id: userId
  }).then(success => success[0]);
  if(!exists) {
    return Promise.reject('');
  }
  if(!exists.telegram) {
    return Promise.reject('');
  }
  await user.edit({ id: userId }, { telegram: null });
  telegram.emit('send', +exists.telegram, 'Telegram账号已经解除绑定');
};

exports.getCode = async (userId) => {
  const exists = await knex('user').where({
    id: userId
  }).then(success => success[0]);
  if(exists && exists.telegram) {
    return {
      user: exists.telegram,
    };
  }
  for(const code in codes) {
    if(Date.now() - codes[code].time > 10 * 60 * 1000) {
      delete codes[code];
    }
  }
  const botInfo = await getMe();
  if(codes[userId]) {
    return {
      code: codes[userId].code,
      telegram: botInfo.result.username,
    };
  } else {
    codes[userId] = {
      code: Math.random().toString().substr(2, 8),
      time: Date.now(),
    };
    return {
      code: codes[userId].code,
      telegram: botInfo.result.username,
    };
  }
};

exports.unbindUser = unbindUser;