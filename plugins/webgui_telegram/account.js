const telegram = appRequire('plugins/webgui_telegram/index').telegram;
const isUser = appRequire('plugins/webgui_telegram/index').isUser;
const account = appRequire('plugins/account/index');

const isAccount = message => {
  if(!message.message || !message.message.text) { return false; }
  if(!message.message || !message.message.chat || !message.message.chat.type === 'private') { return false; }
  if(message.message.text.trim() !== 'account') { return false; }
  return true;
};

telegram.on('message', async message => {
  if(!isAccount(message)) { return; }
  const telegramId = message.message.chat.id.toString();
  const userId = await isUser(telegramId);
  const myAccount = await account.getAccount({ userId });
  console.log(myAccount);
});