const os = require('os');
const path = require('path');
const program = require('commander');
const version = appRequire('package').version;
const log = appRequire('init/log');

const log4js = require('log4js');
const logger = log4js.getLogger('system');

const ssmgrPath = path.resolve(os.homedir(), './.ssmgr/');

program
  .version('shadowsocks-manager ' + version)
  .option('-c, --config [file]', 'config file, default: ~/.ssmgr/default.yml')
  .option('-d, --db [file]', 'sqlite3 file, sample: ~/.ssmgr/db.sqlite')
  .option('-t, --type [type]', 'type, s for server side, m for manager side')
  .option('-s, --shadowsocks [address]', 'ss-manager address, sample: 127.0.0.1:6001')
  .option('-m, --manager [address]', 'manager address, sample: 0.0.0.0:6002')
  .option('-p, --password [password]', 'manager password, both server side and manager side must be equals')
  .option('-r, --run [type]', 'run shadowsocks from child_process, sample: libev / libev:aes-256-cfb / python / python:aes-256-cfb')
  .option('--debug', 'show debug message')
  .option('--multiCore', 'multi core')
  .parse(process.argv);

if(program.config) { global.configFile = program.config; }

if(!program.debug) {
  log.setConsoleLevel('ERROR');
}

const config = appRequire('services/config');
let logName = 'uname';

if(program.type) {config.set('type', program.type);}
if(program.shadowsocks) {config.set('shadowsocks.address', program.shadowsocks);}
if(program.manager) {config.set('manager.address', program.manager);}
if(program.password) {config.set('manager.password', program.password);}
if(program.db) {
  config.set('db', program.db);
}
if (typeof config.get('db') === 'object') {
  logName = config.get('db.database');
} else {
  const dbpath = config.get('db');
  logName = path.basename(dbpath).split('.')[0];
  if (dbpath[0] === '/' || dbpath[0] === '.' || dbpath[0] === '~') {
	  config.set('db', path.resolve(dbpath));
  } else {
	  config.set('db', path.resolve(ssmgrPath, dbpath));
  }
}
log.setFileAppenders(logName);

if(program.run) {
  config.set('runShadowsocks', program.run);
}
