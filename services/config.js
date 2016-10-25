'use strict';

const yaml = require('js-yaml');
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const _ = require('lodash');

let config;

const defaultPath = path.resolve(os.homedir() + '/.ssmgr/default.yml');
let configFilePath = defaultPath;
if(global.configFile) {
  if(global.configFile[0] === '~') {
    configFilePath = path.resolve(os.homedir() + global.configFile.substr(1));
  } else {
    configFilePath = path.resolve(global.configFile);
  }
}

try {
  config = yaml.safeLoad(fs.readFileSync(configFilePath), 'utf8');
} catch (e) {
  console.log(e);
}

exports.all = () => {
  return config;
};

exports.get = (path) => {
  if(!config) {
    return;
  }
  return _.get(config, path);
};

exports.set = (path, value) => {
  return _.set(config, path, value);
};
