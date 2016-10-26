'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const _ = require('lodash');
const config = appRequire('services/config').all();
const isFlowSaverUse = _.get(config, 'plugins.flowSaver.use');
const bot = appRequire('plugins/telegram/index').bot;
const isManager = appRequire('plugins/telegram/index').isManager;

const init = (() => {
  var _ref = _asyncToGenerator(function* () {
    if (!isFlowSaverUse) {
      return;
    }
    const server = appRequire('plugins/flowSaver/server');

    bot.onText(/\/slist/, function (msg, match) {
      const fromId = msg.from.id;
      isManager(fromId).then(function (s) {
        return server.list();
      }).then(function (s) {
        bot.sendMessage(fromId, JSON.stringify(s));
      }).catch(function () {
        bot.sendMessage(fromId, 'Error');
      });
    });
  });

  return function init() {
    return _ref.apply(this, arguments);
  };
})();

init();