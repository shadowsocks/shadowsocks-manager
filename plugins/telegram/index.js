'use strict';

const path = require('path');
// appRequire('plugins/telegram/db');
const TelegramBot = require('node-telegram-bot-api');
const manager = appRequire('services/manager');;
const config = appRequire('services/config').all();
const token = config.plugins.telegram.token;

const bot = new TelegramBot(token, {polling: true});

exports.bot = bot;

const knex = appRequire('init/knex').knex;

const setManager = async (id) => {
  const findId = await knex('telegram').select(['value']).where({
    key: 'manager',
  });
  if(findId.length > 0) {
    return Promise.reject();
  }
  const insertId = await knex('telegram').insert({
    key: 'manager',
    value: id,
  });
  return id;
};

const isManager = async (id) => {
  const findId = await knex('telegram').select(['value']).where({
    key: 'manager',
    value: id,
  });
  if (findId.length > 0) {
    return findId.value;
  } else {
    return Promise.reject('Unauthorized');
  }
};

exports.isManager = isManager;

appRequire('plugins/telegram/server');

bot.onText(/\/auth/, (msg, match) => {
  const fromId = msg.from.id;
  setManager(fromId).then(s => {
    bot.sendMessage(fromId, 'Set manager success');
  }, e => {
    bot.sendMessage(fromId, 'Manager is already set');
  });
});

const numberPad = {
  inline_keyboard: [
    [
      { text: '7', callback_data: '7', },
      { text: '8', callback_data: '8', },
      { text: '9', callback_data: '9', },
    ],
    [
      { text: '4', callback_data: '4', },
      { text: '5', callback_data: '5', },
      { text: '6', callback_data: '6', },
    ],
    [
      { text: '1', callback_data: '1', },
      { text: '2', callback_data: '2', },
      { text: '3', callback_data: '3', },
    ],
    [
      { text: 'C', callback_data: 'C', },
      { text: '0', callback_data: '0', },
      { text: 'E', callback_data: 'E', },
    ],
  ],
};

// bot.onText(/\/test/, function (msg, match) {
//   var fromId = msg.from.id;
//   setManager(fromId);
//   var resp = 'Please enter port number: ';
//   bot.sendMessage(fromId, resp, {
//     reply_markup: numberPad
//   });
// });
//
// bot.on('callback_query', (msg) => {
//   console.log();
//   console.log(msg);
//   const message_id = msg.message.message_id;
//   const chat_id = msg.message.chat.id;
//   console.log(message_id);
//   console.log(chat_id);
//   bot.answerCallbackQuery(msg.id, '', false).then(s=>{console.log(s);}, e=>{console.log(e);});
//   bot.editMessageText('ZZZ', {
//     message_id,
//     chat_id,
//     reply_markup: numberPad,
//   }).then(s=>{console.log(s);}, e=>{console.log(e);});
// });

bot.onText(/\/add (.+)/, (msg, match) => {
  const fromId = msg.from.id;
  isManager(fromId).then(s => {
    const port = +match[1].split(' ')[0];
    const password = match[1].split(' ')[1];
    return manager.send({
      command: 'add',
      port,
      password,
    });
  }).then(s => {
    bot.sendMessage(fromId, `Add account success. [${ s.port }][${ s.password }]`);
  }).catch(e => {
    bot.sendMessage(fromId, 'Error');
  });
});

bot.onText(/\/del (.+)/, (msg, match) => {
  const fromId = msg.from.id;
  isManager(fromId).then(s => {
    const port = +match[1].split(' ')[0];
    return manager.send({
      command: 'del',
      port,
    });
  }).then(s => {
    bot.sendMessage(fromId, `Del account success. [${ s.port }]`);
  }).catch(e => {
    bot.sendMessage(fromId, 'Error');
  });
});

bot.onText(/\/pwd (.+)/, (msg, match) => {
  const fromId = msg.from.id;
  isManager(fromId).then(s => {
    const port = +match[1].split(' ')[0];
    const password = match[1].split(' ')[1];
    return manager.send({
      command: 'pwd',
      port,
      password,
    });
  }).then(s => {
    bot.sendMessage(fromId, `Change password success. [${ s.port }][${ s.password }]`);
  }).catch(e => {
    console.log(e);
    bot.sendMessage(fromId, 'Error');
  });;
});

bot.onText(/\/list/, (msg, match) => {
  const fromId = msg.from.id;
  isManager(fromId).then(s => {
    return manager.send({
      command: 'list',
    });
  }).then(s => {
    bot.sendMessage(fromId, JSON.stringify(s));
  }).catch(() => {
    bot.sendMessage(fromId, 'Error');
  });
});
