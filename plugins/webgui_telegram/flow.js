const knex = appRequire('init/knex').knex;
const moment = require('moment');
const flow = appRequire('plugins/flowSaver/flow');
const tg = appRequire('plugins/webgui_telegram/index');
const telegram = appRequire('plugins/webgui_telegram/index').telegram;
const cron = appRequire('init/cron');
const log4js = require('log4js');
const logger = log4js.getLogger('telegram');

const getUserAccount = userId => {
  return knex('account_plugin').where({
    userId
  });
};

const prettyFlow = number => {
  if(number >= 0 && number < 1000) {
    return number + ' B';
  } else if(number >= 1000 && number < 1000 * 1000) {
    return (number / 1000).toFixed(1) + ' KB';
  } else if(number >= 1000 * 1000 && number < 1000 * 1000 * 1000) {
    return (number / (1000 * 1000)).toFixed(2) + ' MB';
  } else if(number >= 1000 * 1000 * 1000 && number < 1000 * 1000 * 1000 * 1000) {
    return (number / (1000 * 1000 * 1000)).toFixed(3) + ' GB';
  } else if(number >= 1000 * 1000 * 1000 * 1000 && number < 1000 * 1000 * 1000 * 1000 * 1000) {
    return (number / (1000 * 1000 * 1000 * 1000)).toFixed(3) + ' TB';
  } else {
    return number + '';
  }
};

const getUsers = async () => {
  const users = await knex('user').where({ type: 'normal' }).whereNotNull('telegram');
  users.forEach(async user => {
    const accounts = await getUserAccount(user.id);
    const start = moment().add(-1, 'd').hour(0).minute(0).second(0).millisecond(0).toDate().getTime();
    const end = moment().hour(0).minute(0).second(0).millisecond(0).toDate().getTime();
    accounts.forEach(async account => {
      const myFlow = await flow.getFlowFromSplitTime(null, account.id, start, end);
      const message = `昨日流量统计：[${ account.port }] ${ prettyFlow(myFlow) }`;
      logger.info(message);
      // telegram.emit('send', +user.telegram, message);
      tg.sendMessage(message, +user.telegram);
    });
  });
};

cron.cron(getUsers, 'GetUsers', '0 9 * * *', 24 * 3600);
