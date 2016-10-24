'use strict';

const flowSaverServer = appRequire('plugins/flowSaver/server');
const inquirer = require('inquirer');

const list = async () => {
  try {
    const a = await flowSaverServer.list();
    console.log(a);
  } catch(err) {
    return Promise.reject(err);
  }
};

exports.list = list;
