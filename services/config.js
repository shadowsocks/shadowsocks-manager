'use strict';

const yaml = require('js-yaml');
const fs   = require('fs');
const os   = require('os');
const path = require('path');
const _ = require('lodash');

let configFile;

try {
  configFile = yaml.safeLoad(fs.readFileSync(path.resolve(os.homedir() + '/.ssmgr/default.yml'), 'utf8'));
} catch (e) {
  console.log(e);
}

exports.all = () => {
  return configFile;
};

exports.get = (path) => {
  if(!configFile) {
    return;
  }
  return _.get(configFile, path);
};

exports.set = (path, value) => {
  return _.set(configFile, path, value);
};
