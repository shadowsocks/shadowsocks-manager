'use strict';

const _ = require('lodash');
const config = appRequire('services/config').all();
const isFlowSaverUse = _.get(config, 'plugins.flowSaver.use');
const bot = appRequire('plugins/telegram/index').bot;
const isManager = appRequire('plugins/telegram/index').isManager;

const init = async () => {
  if(!isFlowSaverUse) {
    return;
  }
  const server = appRequire('plugins/flowSaver/server');

  bot.onText(/\/slist/, (msg, match) => {
    const fromId = msg.from.id;
    isManager(fromId).then(s => {
      return server.list();
    }).then(s => {
      bot.sendMessage(fromId, JSON.stringify(s));
    }).catch(() => {
      bot.sendMessage(fromId, 'Error');
    });
  });

};

init();
