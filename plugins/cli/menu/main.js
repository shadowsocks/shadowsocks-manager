'use strict';

const inquirer = require('inquirer');
const listPort = appRequire('plugins/cli/menu/listPort');
const addPort = appRequire('plugins/cli/menu/addPort');

const main = [
  {
    type: 'list',
    name: 'mainMeun',
    message: 'Main Meun',
    choices: ['add port', 'list port'],
  }
];

const mainMeun = () => {
  console.log();
  inquirer.prompt(main)
  .then(success => {
    if(success.mainMeun === 'list port') {
      return listPort.list();
    } else if(success.mainMeun === 'add port') {
      return addPort.add();
    }
  }).then(() => {
    return mainMeun();
  })
  .catch(() => {
    return mainMeun();
  });
};

mainMeun();
