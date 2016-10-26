'use strict';

const telegram = appRequire('plugins/telegram/index').telegram;
const managerAddress = appRequire('plugins/telegram/managerAddress');
const flowSaverServer = appRequire('plugins/flowSaver/server');

const list = (message) => {
  flowSaverServer.list().then(servers => {
    let str = '';
    servers.forEach(server => {
      str += `${server.name}, ${server.host}:${server.port} ${server.password}`;
    });
    telegram.emit('send', message, str);
  }).catch(err => {
    console.log(err);
  });
};

telegram.on('manager', message => {
  if(message.message.text === 'list server') {
    list(message);
  }
});
