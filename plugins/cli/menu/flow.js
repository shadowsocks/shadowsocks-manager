'use strict';

const inquirer = require('inquirer');
const flow = appRequire('plugins/flowSaver/flow');
const index = appRequire('plugins/cli/index');
const flowSaverServer = appRequire('plugins/flowSaver/server');

const menu = [
  {
    type: 'list',
    name: 'flow',
    message: 'Select time:',
    choices: ['5 mins', '1 hour', '24 hours'],
  }
];

const flowNumber = (number) => {
  if(number < 1000) return number + ' B';
  else if(number < 1000 * 1000) return number / 1000 + ' KB';
  else if(number < 1000 * 1000 * 1000) return (number / 1000000).toFixed(2) + ' MB';
  else if(number < 1000 * 1000 * 1000 * 1000) return (number / 1000000000).toFixed(3) + ' GB';
};

const getFlow = async () => {
  try {
    const flowTime = await inquirer.prompt(menu);
    const managerAddress = index.getManagerAddress();
    let startTime = Date.now();
    const endTime = Date.now();
    if(flowTime.flow === '5 mins') {
      startTime -= 5 * 60 * 1000;
    } else if(flowTime.flow === '1 hour') {
      startTime -= 60 * 60 * 1000;
    } else if(flowTime.flow === '24 hours') {
      startTime -= 24 * 60 * 60 * 1000;
    }
    const myFlow = await flow.getFlow(managerAddress.host, managerAddress.port, startTime, endTime);
    console.log(myFlow.map(m => {
      return {
        port: m.port,
        flow: flowNumber(m.sumFlow),
      };
    }));
    return;
  } catch(err) {
    console.log(err);
    return Promise.reject(err);
  }
};

exports.getFlow = getFlow;
