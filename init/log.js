const fs = require('fs');
const os = require('os');
const path = require('path');
const ssmgrPath = path.resolve(os.homedir(), '.ssmgr');
const logPath = path.resolve(os.homedir(), '.ssmgr', 'logs');
const log4js = require('log4js');

const category = [
  'system',
  'account',
  'email',
  'telegram',
  'freeAccount',
  'webgui',
  'alipay',
  'express',
  'flowSaver',
  'paypal',
  'giftcard',
  'autoban',
];

const configure = {
  appenders: {
    console: { type: 'console' },
    filter: { type: 'logLevelFilter', appender: 'console', level: 'debug' }
  },
  categories: {
    default: { appenders: [ 'console' ], level: 'debug' },
  },
  disableClustering: true,
};

log4js.configure(configure);

const setConsoleLevel = level => {
  configure.appenders.filter = { type: 'logLevelFilter', appender: 'console', level };
  log4js.configure(configure);
};

const setFileAppenders = (filename) => {
  try {
    fs.statSync(ssmgrPath);
  } catch(err) {
    fs.mkdirSync(ssmgrPath);
  }
  try {
    fs.statSync(logPath);
  } catch(err) {
    fs.mkdirSync(logPath);
  }
  try {
    fs.statSync(path.resolve(logPath, filename));
  } catch(err) {
    fs.mkdirSync(path.resolve(logPath, filename));
  }
  for(const ctg of category) {
    configure.appenders[ctg] = {
      type: 'dateFile',
      filename: path.resolve(logPath, filename, ctg + '.log'),
      pattern: '-yyyy-MM-dd',
      compress: true,
    };
    configure.categories[ctg] = { appenders: [ ctg, 'filter' ], level: 'debug' };
  }
  log4js.configure(configure);
};

exports.setConsoleLevel = setConsoleLevel;
exports.setFileAppenders = setFileAppenders;
