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
  if(fs.existsSync(path.resolve(global.configFile))) {
    configFilePath = path.resolve(global.configFile);
  } else if(fs.existsSync(path.resolve(os.homedir() + '/.ssmgr/' + global.configFile))) {
    configFilePath = path.resolve(os.homedir() + '/.ssmgr/' + global.configFile);
  } else {
    logger.error(`Can not find file: ${ global.configFile }`);
    process.exit(1);
  }
}

try {
  logger.info('Config file path: ', configFilePath);
  const configFileData = fs.readFileSync(configFilePath);
  if(configFilePath.substr(configFilePath.length - 5) === '.json') {
    config = JSON.parse(configFileData);
  } else {
    config = yaml.safeLoad(configFileData, 'utf8');
  }
} catch (err) {
  logger.error(err);
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
