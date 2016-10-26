'use strict';

const telegram = appRequire('plugins/telegram/index').telegram;
const managerAddress = appRequire('plugins/telegram/managerAddress');
const flowSaverServer = appRequire('plugins/flowSaver/server');

const list = (message) => {
  flowSaverServer.list().then(servers => {
    let str = '';
    servers.forEach(server => {
      str += `${server.name}, ${server.host}:${server.port} ${server.password}\n`;
    });
    telegram.emit('send', message, str);
  }).catch(err => {
    console.log(err);
  });
};

const add = (message, name, host, port, password) => {
  flowSaverServer.add(name, host, port, password)
  .then(success => {
    telegram.emit('send', message, `Add server ${name} success.`);
  })
  .catch(err => {
    console.log(err);
  });
};

telegram.on('manager', message => {

  const addReg = new RegExp(/^addserver ([\w\.]{0,}) ([\w\.]{0,}) (\d{0,5}) ([\w]{0,})$/);

  if(message.message.text === 'listserver') {
    list(message);
  } else if(message.message.text.match(addReg)) {
    const reg = message.message.text.match(addReg);
    const name = reg[1];
    const host = reg[2];
    const port = +reg[3];
    const password = reg[4];
    add(message, name, host, port, password);
  }
});
