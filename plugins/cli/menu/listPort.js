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
    choices: ['Delete port', 'Change password', 'Exit'],
    when: function (answers) {
      if(answers.port === 'Exit') {
        return Promise.reject();
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
      const choice = (f.port + '     ').substr(0, 5) + ', ' + f.password;
      menu[0].choices.push(choice);
    });
    menu[0].choices.push('Exit');
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
        port: selectPort.port.split(',')[0],
      }, index.getManagerAddress());
      return;
    } else if (selectPort.act === 'Change password') {
      const newPassword = await inquirer.prompt(password);
      await manager.send({
        command: 'pwd',
        port: selectPort.port.split(',')[0],
        password: newPassword.password,
      }, index.getManagerAddress());
      return;
    } else if (selectPort.act === 'Exit') {
      return;
    }
  } catch(err) {
    return Promise.reject(err);
  }
};

exports.list = list;
