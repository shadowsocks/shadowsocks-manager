'use strict';

const manager = appRequire('services/manager');
const index = appRequire('plugins/cli/index');

const inquirer = require('inquirer');

const menu = [{
  type: 'input',
  name: 'port',
  message: 'Enter port:',
  validate: function (value) {
    if(Number.isNaN(+value)) {
      return 'Please enter a valid port number.';
    } else if (+value <= 0 || +value >= 65536) {
      return 'Port number must between 1 to 65535.';
    } else {
      return true;
    }
  },
}, {
  type: 'input',
  name: 'password',
  message: 'Enter password:',
  validate: function (value) {
    if(value === '') {
      return 'You can not set an empty password.';
    } else {
      return true;
    }
  },
}];

const add = async () => {
  try {
    const addPort = await inquirer.prompt(menu);
    await manager.send({
      command: 'add',
      port: +addPort.port,
      password: addPort.password,
    }, index.getManagerAddress());
    return;
  } catch(err) {
    return Promise.reject(err);
  }
};

exports.add = add;
