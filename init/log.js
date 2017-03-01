const fs = require('fs');
const os = require('os');
const path = require('path');
const logPath = path.resolve(os.homedir() + '/.ssmgr/logs');

const log4js = require('log4js');
log4js.configure({
  appenders: [
    {
      type: 'console',
      category: 'system',
    },
    {
      type: 'console',
      category: 'email',
    },
    {
      type: 'console',
      category: 'telegram',
    },
    {
      type: 'console',
      category: 'freeAccount',
    },
    {
      type: 'console',
      category: 'webgui',
    },
    {
      type: 'console',
      category: 'alipay',
    },
  ]
});

const setFileAppenders = (filename) => {
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
  const file = path.resolve(logPath, filename + '/system.log');
  log4js.loadAppender('dateFile');
  log4js.addAppender(log4js.appenderMakers['dateFile']({
    type: 'dateFile',
    filename: file,
    pattern: '-yyyy-MM-dd',
  }), 'system');
};

exports.setFileAppenders = setFileAppenders;
