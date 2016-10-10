'use strict';

const _ = require('lodash');
const config = appRequire('services/config').all();
const isFlowSaverUse = _.get(config, 'plugins.flowSaver.use');
const index = appRequire('plugins/cli/index');
const inquirer = require('inquirer');

let server;

const command = {
  '* server add': () => {
    console.log('ZZZ');
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
  return command[data]();
}

exports.flowSaverCommand = flowSaverCommand;
