'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const log4js = require('log4js');
const logger = log4js.getLogger('telegram');

const rp = require('request-promise');
const knex = appRequire('init/knex').knex;
const _ = require('lodash');
const config = appRequire('services/config').all();
const isFlowSaverUse = _.get(config, 'plugins.flowSaver.use');
const token = config.plugins.telegram.token;

const url = `https://api.telegram.org/bot${token}/`;

const setUpdateId = (() => {
  var _ref = _asyncToGenerator(function* (id) {
    try {
      const result = yield knex('telegram').select(['value']).where({ key: 'updateId' });
      if (result.length === 0) {
        yield knex('telegram').insert({
          key: 'updateId',
          value: id
        });
      } else {
        yield knex('telegram').where({ key: 'updateId' }).update({
          value: id
        });
      }
      return id;
    } catch (err) {
      return Promise.reject(err);
    }
  });

  return function setUpdateId(_x) {
    return _ref.apply(this, arguments);
  };
})();

const getUpdateId = (() => {
  var _ref2 = _asyncToGenerator(function* () {
    try {
      const result = yield knex('telegram').select(['value']).where({ key: 'updateId' });
      if (result.length === 0) {
        return 1;
      } else {
        return result[0].value;
      }
    } catch (err) {
      return Promise.reject(err);
    }
  });

  return function getUpdateId() {
    return _ref2.apply(this, arguments);
  };
})();

const getMessages = (() => {
  var _ref3 = _asyncToGenerator(function* (updateId) {
    try {
      const result = yield rp({
        method: 'GET',
        uri: url + 'getUpdates',
        qs: {
          offset: updateId,
          timeout: 30
        },
        simple: false
      });
      const data = JSON.parse(result);
      if (data.ok && data.result.length) {
        return data.result;
      } else {
        return;
      }
    } catch (err) {
      logger.error(err);
      return Promise.reject(err);
    }
  });

  return function getMessages(_x2) {
    return _ref3.apply(this, arguments);
  };
})();

const sendMessage = (text, chat_id, reply_to_message_id) => {
  return rp({
    method: 'GET',
    uri: url + 'sendMessage',
    qs: {
      chat_id,
      text,
      reply_to_message_id
    },
    simple: false
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

const pullingMessage = (() => {
  var _ref4 = _asyncToGenerator(function* () {
    try {
      const id = yield getUpdateId();
      const messages = yield getMessages(id);
      if (messages) {
        logger.info(`Get messages, id: ${id}, message: ${messages.length}`);
        yield setUpdateId(messages[messages.length - 1].update_id + 1);
        messages.forEach(function (message) {
          logger.info(`Message ${message.update_id} from ${message.message.from.username}: ${message.message.text}`);
          telegram.emit('message', message);
        });
      }
    } catch (err) {
      logger.error(err);
    }
  });

  return function pullingMessage() {
    return _ref4.apply(this, arguments);
  };
})();

const main = () => {
  pullingMessage().then(() => {
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
if (isFlowSaverUse) {
  appRequire('plugins/telegram/server');
  appRequire('plugins/telegram/flow');
}