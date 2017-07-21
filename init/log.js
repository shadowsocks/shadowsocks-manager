const fs = require('fs');
const os = require('os');
const path = require('path');
const ssmgrPath = path.resolve(os.homedir() + '/.ssmgr');
const logPath = path.resolve(os.homedir() + '/.ssmgr/logs');
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
];

log4js.configure({
  appenders: [{
    type: 'console',
    category,
  }],
});

const setConsoleLevel = level => {
  log4js.configure({
    appenders: [{
      type: 'logLevelFilter',
      level,
      category,
      appender: {
        type: 'console',
      }
    }]
  });
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
  log4js.loadAppender('dateFile');
  category.forEach(ctg => {
    log4js.addAppender(log4js.appenderMakers['dateFile']({
      type: 'dateFile',
      filename: path.resolve(logPath, filename + '/' + ctg + '.log'),
      pattern: '-yyyy-MM-dd',
      compress: true,
    }), ctg);
  });
};

exports.setConsoleLevel = setConsoleLevel;
exports.setFileAppenders = setFileAppenders;
