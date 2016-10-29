'use strict';

const yaml = require('js-yaml');
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const _ = require('lodash');

const log4js = require('log4js');
const logger = log4js.getLogger('system');

let config;

const defaultPath = path.resolve(os.homedir() + '/.ssmgr/default.yml');
let configFilePath = defaultPath;
if(global.configFile) {
  configFilePath = path.resolve(os.homedir() + '/.ssmgr/' + global.configFile);
}

try {
  logger.info('Config file path: ', configFilePath);
  config = yaml.safeLoad(fs.readFileSync(configFilePath), 'utf8');
} catch (err) {
  logger.info(err);
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
