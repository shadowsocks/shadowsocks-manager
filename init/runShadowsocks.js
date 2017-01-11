'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('system');

const config = appRequire('services/config').all();

const spawn = require('child_process').spawn;

const run = async () => {
  const type = config.runShadowsocks;
  let method = 'aes-256-cfb';
  if(!type) {
    return;
  }
  if(type.indexOf(':') >= 0) {
    method = type.split(':')[1];
  }
  let shadowsocks;
  if(type === 'python') {
    shadowsocks = spawn('ssserver', ['-m', method, '-p', '65535', '-k', 'qwerASDF395745725', config.shadowsocks.address]);
  } else {
    shadowsocks = spawn('ss-manager', [ '-m', method, '-u', '--manager-address', config.shadowsocks.address]);
  }

  shadowsocks.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  shadowsocks.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  shadowsocks.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
  logger.info(`Run shadowsocks (${ type === 'python' ? 'python' : 'libev'})`);
  return;
};

exports.run = run;
