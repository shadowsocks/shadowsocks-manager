'use strict';

const telegram = appRequire('plugins/telegram/index').telegram;
const manager = appRequire('services/manager');
const managerAddress = appRequire('plugins/telegram/managerAddress');

const list = (message) => {
  manager.send({
    command: 'list'
  }, managerAddress.get()).then(ports => {
    telegram.emit('send', message, JSON.stringify(ports));
  }).catch(err => {
    console.log(err);
  });
};

const add = (message, port, password) => {
  manager.send({
    command: 'add',
    port,
    password,
  }, managerAddress.get()).then(success => {
    telegram.emit('send', message, `add port ${success.port} success.`);
  });
};

const del = (message, port) => {
  manager.send({
    command: 'del',
    port,
  }, managerAddress.get()).then(success => {
    telegram.emit('send', message, `delete port ${success.port} success.`);
  });
};

telegram.on('manager', message => {

  const addReg = new RegExp(/^\/add (\d{0,5}) ([\w]{0,})$/);
  const delReg = new RegExp(/^\/del (\d{0,5})$/);

  if(message.message.text === '/list') {
    list(message);
  } else if(message.message.text.match(addReg)) {
    const reg = message.message.text.match(addReg);
    const port = +reg[1];
    const password = reg[2];
    add(message, port, password);
  } else if(message.message.text.match(delReg)) {
    const reg = message.message.text.match(delReg);
    const port = +reg[1];
    del(message, port);
  }
});
