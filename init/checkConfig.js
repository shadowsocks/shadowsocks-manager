'use strict';

const os = require('os');
const path = require('path');
const program = require('commander');
const version = appRequire('package').version;
const log = appRequire('init/log');

const log4js = require('log4js');
const logger = log4js.getLogger('system');

let ssmgrPath = path.resolve(os.homedir() + '/.ssmgr/');

program
  .version('shadowsocks-manager ' + version)
  .option('-c, --config [file]', 'config file, default: ~/.ssmgr/default.yml')
  .option('-d, --db [file]', 'sqlite3 file, default: ~/.ssmgr/db.sqlite')
  .option('-e, --empty', 'clean database')
  .option('-t, --type [type]', 'manager type, s for server side, m for manager side, default: s')
  .option('-s, --shadowsocks [address]', 'ss-manager address, default: 127.0.0.1:6001')
  .option('-m, --manager [address]', 'manager address, default: 127.0.0.1:6002')
  .option('-p, --password [password]', 'manager password, both server side and manager side must be equals')
  .option('-r, --run [type]', 'run shadowsocks from child_process, the type is libev or python, if you want to set encrypt method, fill it like libev:aes-256-cfb')
  .option('--debug', 'show debug message')
  .parse(process.argv);

if(program.config) { global.configFile = program.config; }

const config = appRequire('services/config');
let logName = 'uname';

if(program.type) {config.set('type', program.type);}
if(program.empty) {config.set('empty', program.empty);}
if(program.shadowsocks) {config.set('shadowsocks.address', program.shadowsocks);}
if(program.manager) {config.set('manager.address', program.manager);}
if(program.password) {config.set('manager.password', program.password);}
if(program.db) {
  config.set('db', path.resolve(ssmgrPath + '/db.sqlite'));
  logName = program.db.split('.')[0];
} else if (typeof config.get('db') === 'object') {
  logName = config.get('db.database');
} else {
  logName = config.get('db').split('.')[0];
  config.set('db', path.resolve(ssmgrPath + '/' + config.get('db')));
}
log.setFileAppenders(logName);

if(program.run) {
  config.set('runShadowsocks', program.run);
}
if(!program.debug) {
  log.setConsoleLevel('ERROR');
}

// logger.info('Config:\n', JSON.stringify(config.all(), null, 2));
