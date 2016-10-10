'use strict';

const manager = appRequire('services/manager');
const inquirer = require('inquirer');

const config = appRequire('services/config').all();

let managerAddress = {
  host: config.manager.address.split(':')[0],
  port: +config.manager.address.split(':')[1],
  password: config.manager.password,
}

const setManagerAddress = (host, port, password) => {
  managerAddress.host = host;
  managerAddress.port = port;
  managerAddress.password = password;
};

const main = {
  type: 'list',
  name: 'main',
  message: 'Select command: ',
  choices: ['add port', 'del port', 'change password', 'list port']
};

const add = [{
  type: 'input',
  name: 'port',
  message: 'Enter port: ',
  validate: function (value) {
    if(Number.isNaN(+value)) {
      return 'Please enter a valid port number';
    } else if (+value <= 0 || +value >= 65536) {
      return 'Port number must between 1 to 65535';
    } else {
      return true;
    }
  },
}, {
  type: 'input',
  name: 'password',
  message: 'Enter password: ',
  validate: function (value) {
    if(value === '') {
      return 'You can not set an empty password';
    } else {
      return true;
    }
  },
}, {
  type: 'confirm',
  name: 'confirm',
  message: 'Is this correct?',
  default: true,
  when: (answer) => {
    const port = +answer.port;
    const password = answer.password;
    answer.cmd = {
      command: 'add',
      port,
      password,
    };
    return answer;
  },
}];

const changePassword = [{
  type: 'input',
  name: 'port',
  message: 'Enter port: ',
  validate: function (value) {
    if(Number.isNaN(+value)) {
      return 'Please enter a valid port number';
    } else if (+value <= 0 || +value >= 65536) {
      return 'Port number must between 1 to 65535';
    } else {
      return true;
    }
  },
}, {
  type: 'input',
  name: 'password',
  message: 'Enter password: ',
  validate: function (value) {
    if(value === '') {
      return 'You can not set an empty password';
    } else {
      return true;
    }
  },
}, {
  type: 'confirm',
  name: 'confirm',
  message: 'Is this correct?',
  default: true,
  when: (answer) => {
    const port = +answer.port;
    const password = answer.password;
    answer.cmd = {
      command: 'pwd',
      port,
      password,
    };
    return answer;
  },
}];

const del = [{
  type: 'input',
  name: 'port',
  message: 'Enter port: ',
  validate: function (value) {
    if(Number.isNaN(+value)) {
      return 'Please enter a valid port number';
    } else if (+value <= 0 || +value >= 65536) {
      return 'Port number must between 1 to 65535';
    } else {
      return true;
    }
  },
}, {
  type: 'confirm',
  name: 'confirm',
  message: 'Is this correct?',
  default: true,
  when: (answer) => {
    const port = +answer.port;
    answer.cmd = {
      command: 'del',
      port,
    };
    return answer;
  },
}];

const list = async () => {
  try {
    const result = await manager.send({
      command: 'list',
    }, managerAddress);
    console.log(result);
  } finally {
    return { confirm: false };
  }
};

const mainMenu = () => {
  console.log();
  return inquirer.prompt(main)
  .then(answer => {
    if(answer.main === 'add port') {
      return inquirer.prompt(add);
    } else if (answer.main === 'del port') {
      return inquirer.prompt(del);
    } else if (answer.main === 'list port') {
      return list();
    } else if (answer.main === 'change password') {
      return inquirer.prompt(changePassword);
    } else if (answer.main[0] === '*') {
      return appRequire('plugins/cli/server').flowSaverCommand(answer.main);
    } else {
      return Promise.reject();
    }
  }).then(answer => {
    if(answer.confirm) {
      return manager.send(answer.cmd, managerAddress);
    } else {
      return Promise.reject();
    }
  }).then(() => {
    return mainMenu();
  }).catch(() => {
    return mainMenu();
  });;
};

exports.main = main;
exports.mainMenu = mainMenu;
exports.setManagerAddress = setManagerAddress;

appRequire('plugins/cli/server');
