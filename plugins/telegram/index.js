const log4js = require('log4js');
const logger = log4js.getLogger('telegram');

const rp = require('request-promise');
const knex = appRequire('init/knex').knex;
const _ = require('lodash');
const config = appRequire('services/config').all();
// const isFlowSaverUse = _.get(config, 'plugins.flowSaver.use');
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
        timeout: 30,
      },
      simple: false,
    });
    const data = JSON.parse(result);
    if(data.ok && data.result.length) {
      return data.result;
    } else {
      return;
    }
  } catch(err) {
    logger.error(err);
    return Promise.reject(err);
  }
};

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
telegram.on('send', (message, text) => {
  const chat_id = message.message.chat.id;
  sendMessage(text, chat_id);
});

const pullingMessage = async () => {
  try {
    const id = await getUpdateId();
    const messages = await getMessages(id);
    if(messages) {
      logger.info(`Get messages, id: ${id}, message: ${messages.length}`);
      await setUpdateId(messages[messages.length - 1].update_id + 1);
      messages.forEach(message => {
        logger.info(`Message ${message.update_id} from ${message.message.from.username}: ${message.message.text}`);
        telegram.emit('message', message);
      });
    }
  } catch(err) {
    logger.error(err);
  }
};

const main = () => {
  pullingMessage()
  .then(() => {
    main();
  }, () => {
    main();
  });
};
main();

exports.telegram = telegram;

appRequire('plugins/telegram/auth');
appRequire('plugins/telegram/port');
appRequire('plugins/telegram/help');
appRequire('plugins/telegram/server');
appRequire('plugins/telegram/flow');
