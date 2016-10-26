'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const rp = require('request-promise');
const knex = appRequire('init/knex').knex;
const config = appRequire('services/config').all();
const token = config.plugins.telegram.token;

const url = `https://api.telegram.org/bot${ token }/`;

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
          offset: updateId
        },
        simple: false
      });
      const data = JSON.parse(result);
      if (data.ok && data.result.length) {
        return data.result;
      } else {
        return Promise.reject();
      }
    } catch (err) {
      return Promise.reject(err);
    }
  });

  return function getMessages(_x2) {
    return _ref3.apply(this, arguments);
  };
})();

const sendMessage = (chat_id, reply_to_message_id) => {
  return rp({
    method: 'GET',
    uri: url + 'sendMessage',
    qs: {
      chat_id,
      text: 'ok',
      reply_to_message_id
    },
    simple: false
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