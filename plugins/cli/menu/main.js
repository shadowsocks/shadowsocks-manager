'use strict';

const _ = require('lodash');
const config = appRequire('services/config').all();
const isFlowSaverUse = _.get(config, 'plugins.flowSaver.use');
const inquirer = require('inquirer');
const listPort = appRequire('plugins/cli/menu/listPort');
const addPort = appRequire('plugins/cli/menu/addPort');
const listServer = appRequire('plugins/cli/menu/listServer');
const addServer = appRequire('plugins/cli/menu/addServer');

const main = [
  {
    type: 'list',
    name: 'mainMeun',
    message: 'Main Meun',
    choices: ['add port', 'list port'],
  }
];

if(isFlowSaverUse) {
  main[0].choices.push('add server', 'list server');
}

const mainMeun = () => {
  console.log();
  inquirer.prompt(main)
  .then(success => {
    if(success.mainMeun === 'list port') {
      return listPort.list();
    } else if(success.mainMeun === 'add port') {
      return addPort.add();
    } else if(success.mainMeun === 'list server') {
      return listServer.list();
    } else if(success.mainMeun === 'add server') {
      return addServer.add();
    }
  }).then(() => {
    return mainMeun();
  })
  .catch(() => {
    return mainMeun();
  });
};

mainMeun();
