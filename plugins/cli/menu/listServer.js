'use strict';

const flowSaverServer = appRequire('plugins/flowSaver/server');
const index = appRequire('plugins/cli/index');
const inquirer = require('inquirer');

const menu = [
  {
    type: 'list',
    name: 'server',
    message: 'Select server:',
    choices: [],
  }, {
    type: 'list',
    name: 'act',
    message: 'What do you want?',
    choices: ['Switch to it', 'Delete server', 'Edit server'],
  }
];

const list = async () => {
  try {
    const listServer = await flowSaverServer.list();
    menu[0].choices = [];
    listServer.forEach(f => {
      menu[0].choices.push(f.name);
    });
    const selectServer = await inquirer.prompt(menu);
    if(selectServer.act === 'Switch to it') {
      const server = listServer.filter(f => {
        return f.name === selectServer.server;
      })[0];
      index.setManagerAddress(server.host, server.port, server.password);
      return;
    }
  } catch(err) {
    console.log(err);
    return Promise.reject(err);
  }
};

exports.list = list;
