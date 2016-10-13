'use strict';

const rp = require('request-promise');
const knex = appRequire('init/knex').knex;
const config = appRequire('services/config').all();
const token = config.plugins.telegram.token;

const url = `https://api.telegram.org/bot${ token }/`;

const setUpdateId = async (id) => {
  try {
    const result = await knex('telegram').select(['value']).where({key: 'updateId'});
    if(result.length === 0) {
      await knex('telegram').insert({
        key: 'updateId',
        value: id,
      });
    } else {
      await knex('telegram').where({key: 'updateId'}).update({
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
    const result = await knex('telegram').select(['value']).where({key: 'updateId'});
    if(result.length === 0) {
      return 1;
    } else {
      return result[0].value;
    }
  } catch(err) {
    return Promise.reject(err);
  }
};

const getMessages = async (updateId) => {
  try {
    const result = await rp({
      method: 'GET',
      uri: url + 'getUpdates',
      qs: {
        offset: updateId,
      },
      simple: false,
    });
    const data = JSON.parse(result);
    if(data.ok && data.result.length) {
      return data.result;
    } else {
      return Promise.reject();
    }
  } catch(err) {
    return Promise.reject(err);
  }
};

const sendMessage = (chat_id, reply_to_message_id) => {
  return rp({
    method: 'GET',
    uri: url + 'sendMessage',
    qs: {
      chat_id,
      text: 'ok',
      reply_to_message_id,
    },
    simple: false,
  });
};

let uid;
setInterval(() => {


getUpdateId().then(id => {
  return getMessages(id);
}).then(s => {
  console.log(JSON.stringify(s, null, 4));

  console.log(uid);
  uid = s[0].update_id + 1;
  console.log(uid);
  return sendMessage(s[0].message.chat.id, s[0].message.message_id);
}).then(s => {
  console.log('zzz' + uid);
  return setUpdateId(uid);
}).then(id => {
  console.log(id);
}).catch(e => {
  console.log(e);
});

}, 10 * 1000);
