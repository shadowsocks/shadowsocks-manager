const telegram = appRequire('plugins/telegram/index').telegram;
const knex = appRequire('init/knex').knex;

const log4js = require('log4js');
const logger = log4js.getLogger('telegram');

const setManager = async (message) => {
  try {
    const manager = await knex('telegram').select(['value']).where({
      key: 'manager'
    });
    if(manager.length === 0) {
      await knex('telegram').insert({
        key: 'manager',
        value: message.message.from.id,
      });
      telegram.emit('send', message, 'Authorize success.');
    } else if(+manager[0].value === message.message.from.id) {
      telegram.emit('send', message, 'This user is already a manager.');
    } else {
      telegram.emit('send', message, 'Authorize fail.');
    }
    return;
  } catch(err) {
    logger.error(err);
    return Promise.reject(err);
  }
};

const isManager = async (message) => {
  try {
    const manager = await knex('telegram').select(['value']).where({
      key: 'manager',
    });
    if(manager.length === 0) {
      telegram.emit('send', message, 'Send \'auth\' to become manager.');
    } else if(manager.length > 0 && manager[0].value === message.message.from.id + '') {
      telegram.emit('manager', message);
    }
  } catch(err) {
    logger.error(err);
    return Promise.reject(err);
  }
};

telegram.on('message', message => {
  if (message.message.text === 'auth') {
    setManager(message);
  } else {
    isManager(message);
  }
});
