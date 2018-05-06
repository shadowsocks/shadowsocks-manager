const tg = appRequire('plugins/webgui_telegram/index');
const telegram = appRequire('plugins/webgui_telegram/index').telegram;
const isUser = appRequire('plugins/webgui_telegram/index').isUser;
const isNotUserOrAdmin = appRequire('plugins/webgui_telegram/index').isNotUserOrAdmin;

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
  tg.sendMessage('指令列表：\n\naccount: 显示ss账号信息\nlogin: 快捷登录网页版', telegramId);
});

telegram.on('message', async message => {
  if(!isHelp(message)) { return; }
  const telegramId = message.message.chat.id.toString();
  await isNotUserOrAdmin(telegramId);
  tg.sendMessage('使用方法：\n\n输入邮箱即可注册帐号', telegramId);
});