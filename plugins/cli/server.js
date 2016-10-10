'use strict';

const _ = require('lodash');
const config = appRequire('services/config').all();
const isFlowSaverUse = _.get(config, 'plugins.flowSaver.use');
const index = appRequire('plugins/cli/index');
const inquirer = require('inquirer');

let server;

const command = {
  '* server add': () => {
    return inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter server name: ',
        validate: function (value) {
          if(value === '') {
            return 'You can not set an empty name';
          } else {
            return true;
          }
        },
      }, {
        type: 'input',
        name: 'host',
        message: 'Enter server host: ',
        validate: function (value) {
          if(value === '') {
            return 'You can not set an empty host';
          } else {
            return true;
          }
        },
      }, {
        type: 'input',
        name: 'port',
        message: 'Enter server port: ',
        validate: function (value) {
          if(Number.isNaN(+value)) {
            return 'Please enter a valid port number';
          } else if (+value <= 0 || +value >= 65536) {
            return 'Port number must between 1 to 65535';
          } else {
            return true;
          }
        }
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
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Is this correct?',
        default: true,
        when: (answer) => {
          answer.function = 'add';
          return answer;
        },
      },
    ]);
  },
  '* server del': () => {
    console.log('ZZZ');
  },
  '* server rename': () => {
    console.log('ZZZ');
  },
  '* server list': async () => {
    try {
      const result = await server.list();
      console.log(result);
    } finally {
      return { confirm: false };
    }
  },
  '* server change': () => {
    console.log('ZZZ');
  },
};

const init = async () => {
  if(!isFlowSaverUse) {
    index.mainMenu();
    return;
  }
  server = appRequire('plugins/flowSaver/server');
  const list = await server.list();
  // console.log(list);
  if(list.length === 0) {
    const host = config.manager.address.split(':')[0];
    const port = +config.manager.address.split(':')[1];
    const password = config.manager.password;
    await server.add('default', host, port, password);
  }

  for (const menu in command) {
    index.main.choices.push(menu);
  }

  index.mainMenu();

};

init();

const flowSaverCommand = (data) => {
  return command[data]()
  .then(answer => {
    if(!answer.confirm) {
      return Promise.reject();
    }
    if(answer.function === 'add') {
      return server.add(answer.name, answer.host, +answer.port, answer.password);
    }
  }).then(() => {
    return Promise.reject();
  }).catch(() => {
    return Promise.reject();
  });
}

exports.flowSaverCommand = flowSaverCommand;
