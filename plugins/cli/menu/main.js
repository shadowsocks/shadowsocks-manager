'use strict';

const inquirer = require('inquirer');
const listPort = appRequire('plugins/cli/menu/listPort');

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
    }
  }).then(() => {
    return mainMeun();
  })
  .catch(() => {
    return mainMeun();
  });
};

mainMeun();
