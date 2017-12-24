const knex = appRequire('init/knex').knex;
const config = appRequire('services/config').all();
const token = config.plugins.webgui_telegram.token;
const rp = require('request-promise');
const url = `https://api.telegram.org/bot${ token }/`;

const sendMessage = (text, chat_id, reply_to_message_id) => {
  return rp({
    method: 'GET',
    uri: url + 'sendMessage',
    qs: {
      chat_id,
      text,
      reply_to_message_id,
    },
    simple: false,
  });
};

const EventEmitter = require('events');
class Telegram extends EventEmitter {}
const telegram = new Telegram();

telegram.on('reply', (message, text) => {
  const chat_id = message.message.chat.id;
  const reply_to_message_id = message.message.message_id;
  sendMessage(text, chat_id, reply_to_message_id);
});
telegram.on('send', (chat_id, text) => {
  sendMessage(text, chat_id);
});

const setUpdateId = async (id) => {
  try {
    const result = await knex('webgui_telegram').select(['value']).where({key: 'updateId'});
    if(result.length === 0) {
      await knex('webgui_telegram').insert({
        key: 'updateId',
        value: id || 1,
      });
    } else {
      await knex('webgui_telegram').where({key: 'updateId'}).update({
        value: id,
      });
    }
    return id;
  } catch(err) {
    return Promise.reject(err);
  }
};

const getUpdateId = async () => {
  try {
    const result = await knex('webgui_telegram').select(['value']).where({key: 'updateId'});
    if(result.length === 0) {
      return 1;
    } else {
      return result[0].value;
    }
  } catch(err) {
    return Promise.reject(err);
  }
};

const getMessage = async () => {
  const updateId = await getUpdateId();
  // console.log('updateId: ' + updateId);
  try {
    const result = await rp({
      method: 'GET',
      uri: url + 'getUpdates',
      qs: {
        offset: updateId,
        timeout: 30,
      },
      simple: false,
    });
    const resultObj = JSON.parse(result);
    if(resultObj.ok && resultObj.result.length) {
      resultObj.result.forEach(message => {
        telegram.emit('message', message);
      });
    }
    if(resultObj.result.length) {
      await setUpdateId(resultObj.result[resultObj.result.length - 1].update_id + 1);
    }
  } catch (err) {
    return;
  }
};

const getMe = async () => {
  const result = await rp({
    method: 'GET',
    uri: url + 'getMe',
    qs: {},
    simple: false,
  });
  return JSON.parse(result);
};

const pull = () => {
  getMessage()
  .then(() => {
    pull();
  }).catch(() => {
    pull();
  });
};
pull();

exports.telegram = telegram;
exports.getMe = getMe;

appRequire('plugins/webgui_telegram/user');
