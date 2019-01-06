const telegram = appRequire('plugins/webgui_telegram/index').telegram;
const knex = appRequire('init/knex').knex;

const getAdmin = async () => {
  const exists = await knex('user').where({
    type: 'admin'
  }).then(success => success[0]);
  if(!exists || !exists.telegram) {
    return;
  }
  return exists.telegram;
};

const push = async (message) => {
  const telegramId = await getAdmin();
  telegramId && telegram.emit('send', +telegramId, message);
};

exports.push = push;
