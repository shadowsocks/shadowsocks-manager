const os = require('os');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const ssmgrPath = path.resolve(os.homedir(), './.ssmgr/');

const configFiles = [
  'default.yml',
];

const log4js = require('log4js');
const logger = log4js.getLogger('system');

try {
  fs.statSync(ssmgrPath);
} catch(err) {
  logger.info('~/.ssmgr/ not found, make dir for it.');
  fs.mkdirSync(ssmgrPath);
}
configFiles.forEach(configFile => {
  try {
    fs.statSync(path.resolve(ssmgrPath, configFile));
  } catch(err) {
    logger.info(`~/.ssmgr/${ configFile } not found, make file for it.`);
    fse.copySync(path.resolve(`./config/${ configFile }`), path.resolve(ssmgrPath, configFile));
  }
});
