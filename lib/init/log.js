const fs = require('fs');
const os = require('os');
const path = require('path');
const ssmgrPath = path.resolve(os.homedir() + '/.ssmgr');
const logPath = path.resolve(os.homedir() + '/.ssmgr/logs');
const log4js = require('log4js');

const appenders = ['system', 'email', 'telegram', 'freeAccount', 'webgui', 'alipay', 'express'];

log4js.configure({
  appenders: appenders.map(m => {
    return {
      type: 'console',
      category: m
    };
  })
});

const setFileAppenders = filename => {
  try {
    fs.statSync(ssmgrPath);
  } catch (err) {
    fs.mkdirSync(ssmgrPath);
  }
  try {
    fs.statSync(logPath);
  } catch (err) {
    fs.mkdirSync(logPath);
  }
  try {
    fs.statSync(path.resolve(logPath, filename));
  } catch (err) {
    fs.mkdirSync(path.resolve(logPath, filename));
  }
  log4js.loadAppender('dateFile');
  appenders.forEach(appender => {
    log4js.addAppender(log4js.appenderMakers['dateFile']({
      type: 'dateFile',
      filename: path.resolve(logPath, filename + '/' + appender + '.log'),
      pattern: '-yyyy-MM-dd'
    }), appender);
  });
};

exports.setFileAppenders = setFileAppenders;