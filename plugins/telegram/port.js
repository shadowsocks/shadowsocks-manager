const telegram = appRequire('plugins/telegram/index').telegram;
const manager = appRequire('services/manager');
const managerAddress = appRequire('plugins/telegram/managerAddress');

const log4js = require('log4js');
const logger = log4js.getLogger('telegram');

const list = (message) => {
  manager.send({
    command: 'list'
  }, managerAddress.get()).then(ports => {
    let str = '';
    if(ports.length === 0) {
      str = 'No ports.';
    } else {
      str += `${managerAddress.get().host}:${managerAddress.get().port}\n\n`;
      ports.forEach(port => {
        str += port.port + ', ' + port.password + '\n';
      });
    }
    telegram.emit('send', message, str);
  }).catch(err => {
    logger.error(err);
  });
};

const add = (message, port, password) => {
  manager.send({
    command: 'add',
    port,
    password,
  }, managerAddress.get()).then(success => {
    telegram.emit('send', message, `Add port ${success.port} success.`);
  });
};

const del = (message, port) => {
  manager.send({
    command: 'del',
    port,
  }, managerAddress.get()).then(success => {
    telegram.emit('send', message, `Delete port ${success.port} success.`);
  });
};

const pwd = (message, port, password) => {
  manager.send({
    command: 'pwd',
    port,
    password,
  }, managerAddress.get()).then(success => {
    telegram.emit('send', message, `Change password for port ${success.port} success.`);
  });
};

telegram.on('manager', message => {

  const addReg = new RegExp(/^add (\d{0,5}) ([\w]{0,})$/);
  const delReg = new RegExp(/^del (\d{0,5})$/);
  const pwdReg = new RegExp(/^pwd (\d{0,5}) ([\w]{0,})$/);

  if(message.message.text === 'list') {
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
  } else if(message.message.text.match(pwdReg)) {
    const reg = message.message.text.match(pwdReg);
    const port = +reg[1];
    const password = reg[2];
    pwd(message, port, password);
  }
});
