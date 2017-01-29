'use strict';

const manager = appRequire('services/manager');
const index = appRequire('plugins/cli/index');

const inquirer = require('inquirer');

const menu = [
  {
    type: 'list',
    name: 'port',
    message: 'Select port:',
    choices: [],
  }, {
    type: 'list',
    name: 'act',
    message: 'What do you want?',
    choices: ['Delete port', 'Change password', 'Back'],
    when: function (answers) {
      if(answers.port === 'Back') {
        return Promise.resolve();
      } else {
        return answers;
      }
    }
  }
];

const password = {
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
};

const listPort = async () => {
  try {
    const result = await manager.send({
      command: 'list',
    }, index.getManagerAddress());
    menu[0].choices = [];
    result.forEach(f => {
      const name = (f.port + '     ').substr(0, 5) + ', ' + f.password;
      const value = f.port;
      menu[0].choices.push({
        name,
        value,
      });
    });
    menu[0].choices.push({
      name: 'Back', value: 'Back'
    });
    return;
  } catch(err) {
    console.log(err);
    return Promise.reject(err);
  }
};

const list = async () => {
  try {
    await listPort();
    const selectPort = await inquirer.prompt(menu);
    if(selectPort.act === 'Delete port') {
      await manager.send({
        command: 'del',
        port: selectPort.port,
      }, index.getManagerAddress());
      return;
    } else if (selectPort.act === 'Change password') {
      const newPassword = await inquirer.prompt(password);
      await manager.send({
        command: 'pwd',
        port: selectPort.port,
        password: newPassword.password,
      }, index.getManagerAddress());
      return;
    } else if (selectPort.act === 'Back') {
      return;
    }
  } catch(err) {
    console.log(err);
    return Promise.reject(err);
  }
};

exports.list = list;
