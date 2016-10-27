'use strict';

const os = require('os');
const path = require('path');
const program = require('commander');
const version = appRequire('package').version;

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
  .parse(process.argv);

if(program.config) {global.configFile = program.config;}

const config = appRequire('services/config');

if(program.type) {config.set('type', program.type);}
if(program.empty) {config.set('empty', program.empty);}
if(program.shadowsocks) {config.set('shadowsocks.address', program.shadowsocks);}
if(program.manager) {config.set('manager.address', program.manager);}
if(program.password) {config.set('manager.password', program.password);}
if(program.db) {
  config.set('db', path.resolve(ssmgrPath + '/db.sqlite'));
} else {
  config.set('db', path.resolve(ssmgrPath + '/' + config.get('db')));
}
