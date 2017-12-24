const telegram = appRequire('plugins/webgui_telegram/index').telegram;
const getMe = appRequire('plugins/webgui_telegram/index').getMe;
const knex = appRequire('init/knex').knex;
const user = appRequire('plugins/user/index');

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
  telegram.emit('reply', message, 'Telegram账号绑定成功');
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

telegram.on('message', message => {
  console.log(message);
  if(message.message && message.message.text) {
    if(message.message.text.trim().match(/^\d{8}$/)) {
      for(const code in codes) {
        if(codes[code].code === message.message.text.trim()) {
          bindUser(code, message);
        }
      }
    }
  }
});

const codes = {};

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