'use strict';

const telegram = appRequire('plugins/telegram/index').telegram;

telegram.on('message', message => {
  if (message.message.text === 'help') {
    let str = 'https://github.com/shadowsocks/shadowsocks-manager/tree/master/plugins/telegram';
    telegram.emit('send', message, str);
  }
});
