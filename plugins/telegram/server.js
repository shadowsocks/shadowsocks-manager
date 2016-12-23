'use strict';

const telegram = appRequire('plugins/telegram/index').telegram;
const managerAddress = appRequire('plugins/telegram/managerAddress');
const flowSaverServer = appRequire('plugins/flowSaver/server');

const log4js = require('log4js');
const logger = log4js.getLogger('telegram');

const list = (message) => {
  flowSaverServer.list().then(servers => {
    let str = '';
    servers.forEach(server => {
      str += `[${server.id}]${server.name}, ${server.host}:${server.port} ${server.password}\n`;
    });
    telegram.emit('send', message, str);
  }).catch(err => {
    logger.error(err);
  });
};

const add = (message, name, host, port, password) => {
  flowSaverServer.add(name, host, port, password)
  .then(success => {
    telegram.emit('send', message, `Add server ${name} success.`);
  })
  .catch(err => {
    logger.error(err);
  });
};

const edit = (message, id, name, host, port, password) => {
  flowSaverServer.edit(id, name, host, port, password)
  .then(success => {
    telegram.emit('send', message, `Edit server ${name} success.`);
  })
  .catch(err => {
    logger.error(err);
  });
};

const del = (message, id) => {
  flowSaverServer.del(id)
  .then(success => {
    telegram.emit('send', message, `Delete server ${id} success.`);
  })
  .catch(err => {
    logger.error(err);
  });
};

const switchServer = (message, id) => {
  flowSaverServer.list().then(servers => {
    const server = servers.filter(f => {
      return f.id === +id;
    })[0];
    if(!server) {
      return;
    }
    managerAddress.set(server.host, server.port, server.password);
    telegram.emit('send', message, `Switch to server ${id}.`);
  }).catch(err => {
    logger.error(err);
  });
};

telegram.on('manager', message => {

  const addReg = new RegExp(/^addserver ([\w\.]{0,}) ([\w\.]{0,}) (\d{0,5}) ([\w]{0,})$/);
  const editReg = new RegExp(/^editserver ([\w\.]{0,}) ([\w\.]{0,}) ([\w\.]{0,}) (\d{0,5}) ([\w]{0,})$/);
  const delReg = new RegExp(/^delserver ([\w\.]{0,})$/);
  const switchReg = new RegExp(/^switchserver ([\w\.]{0,})$/);

  if(message.message.text === 'listserver') {
    list(message);
  } else if(message.message.text.match(addReg)) {
    const reg = message.message.text.match(addReg);
    const name = reg[1];
    const host = reg[2];
    const port = +reg[3];
    const password = reg[4];
    add(message, name, host, port, password);
  } else if(message.message.text.match(editReg)) {
    const reg = message.message.text.match(editReg);
    const id = reg[1];
    const name = reg[2];
    const host = reg[3];
    const port = +reg[4];
    const password = reg[5];
    edit(message, id, name, host, port, password);
  } else if(message.message.text.match(delReg)) {
    const reg = message.message.text.match(delReg);
    const id = reg[1];
    del(message, id);
  } else if(message.message.text.match(switchReg)) {
    const reg = message.message.text.match(switchReg);
    const id = reg[1];
    switchServer(message, id);
  }
});
