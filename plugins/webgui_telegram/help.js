const telegram = appRequire('plugins/webgui_telegram/index').telegram;
const isUser = appRequire('plugins/webgui_telegram/index').isUser;

const isHelp = message => {
  if(!message.message || !message.message.text) { return false; }
  if(!message.message || !message.message.chat || !message.message.chat.type === 'private') { return false; }
  if(message.message.text.trim() !== 'help') { return false; }
  return true;
};

telegram.on('message', async message => {
  if(!isHelp(message)) { return; }
  const telegramId = message.message.chat.id.toString();
  const userId = await isUser(telegramId);
  telegram.emit('reply', message, '该功能尚未完成');
});