'use strict';

const _ = require('lodash');
const config = appRequire('services/config').all();
const isFlowSaverUse = _.get(config, 'plugins.flowSaver.use');
const index = appRequire('plugins/cli/index');
const flow = appRequire('plugins/flowSaver/flow');
const inquirer = require('inquirer');

let server;

const flowMenu = async (time) => {

  const flowNumber = (number) => {
    if(number < 1000) return number + ' B';
    else if(number < 1000 * 1000) return number / 1000 + ' KB';
    else if(number < 1000 * 1000 * 1000) return (number / 1000000).toFixed(2) + ' MB';
    else if(number < 1000 * 1000 * 1000 * 1000) return (number / 1000000000).toFixed(3) + ' GB';
  };

  const startTime = Date.now() - time;
  const endTime = Date.now();
  const list = await server.list();
  const managerAddress = index.getManagerAddress();
  const name = list.filter(f => {
    return (f.host === managerAddress.host && f.port === managerAddress.port);
  })[0].name;

  const flows = await flow.getFlow(name, startTime, endTime);
  console.log();
  console.log(flows.map(m => {
    return {
      port: m.port,
      flow: flowNumber(m.sumFlow),
    };
  }));
  return flows;
};

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
      }, {
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
        type: 'confirm',
        name: 'confirm',
        message: 'Is this correct?',
        default: true,
        when: (answer) => {
          answer.function = 'del';
          return answer;
        },
      },
    ]);
  },
  '* server edit': () => {
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
      }, {
        type: 'confirm',
        name: 'confirm',
        message: 'Is this correct?',
        default: true,
        when: (answer) => {
          answer.function = 'edit';
          return answer;
        },
      },
    ]);
  },
  '* server list': async () => {
    try {
      const result = await server.list();
      console.log(result);
    } finally {
      return { confirm: false };
    }
  },
  '* server change': async () => {
    // try {
      console.log();
      const result = await server.list();
      return inquirer.prompt({
        type: 'list',
        name: 'main',
        message: 'Select server: ',
        choices: result.map(m => {return m.name;}),
      }).then(answer => {
        const serverSelected = result.filter(f => {
          return f.name === answer.main;
        })[0];
        index.setManagerAddress(serverSelected.host, +serverSelected.port, serverSelected.password);
        return;
      });
    // }
  },
  '- flow 5 mins': () => {
    flowMenu(5 * 60 * 1000).then();
  },
  '- flow 1 hour': () => {
    flowMenu(60 * 60 * 1000).then();
  },
  '- flow today': () => {
    flowMenu(24* 60 * 60 * 1000).then();
  }
};

const init = async () => {
  if(!isFlowSaverUse) {
    index.mainMenu();
    return;
  }
  server = appRequire('plugins/flowSaver/server');
  // const list = await server.list();
  // if(list.length === 0) {
  //   const host = config.manager.address.split(':')[0];
  //   const port = +config.manager.address.split(':')[1];
  //   const password = config.manager.password;
  //   await server.add('default', host, port, password);
  // }

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
    if(answer.function === 'del') {
      return server.del(answer.name);
    }
    if(answer.function === 'edit') {
      return server.edit(answer.name, answer.host, +answer.port, answer.password);
    }
  }).then(() => {
    return Promise.reject();
  }).catch(() => {
    return Promise.reject();
  });
};

exports.flowSaverCommand = flowSaverCommand;
