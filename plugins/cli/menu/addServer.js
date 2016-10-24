'use strict';

const flowSaverServer = appRequire('plugins/flowSaver/server');
const inquirer = require('inquirer');

const menu = [
  {
    type: 'input',
    name: 'name',
    message: 'Enter server name:',
    validate: function (value) {
      if(value === '') {
        return 'You can not set an empty name.';
      } else {
        return true;
      }
    },
  }, {
    type: 'input',
    name: 'host',
    message: 'Enter server host:',
    validate: function (value) {
      if(value === '') {
        return 'You can not set an empty host.';
      } else {
        return true;
      }
    },
  }, {
    type: 'input',
    name: 'port',
    message: 'Enter server port:',
    validate: function (value) {
      if(Number.isNaN(+value)) {
        return 'Please enter a valid port number.';
      } else if (+value <= 0 || +value >= 65536) {
        return 'Port number must between 1 to 65535.';
      } else {
        return true;
      }
    }
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
  }
];

const add = async () => {
  try {
    const addServer = await inquirer.prompt(menu);
    await flowSaverServer.add(addServer.name, addServer.host, +addServer.port, addServer.password);
    return;
  } catch(err) {
    console.log(err);
    return Promise.reject(err);
  }
};

exports.add = add;
