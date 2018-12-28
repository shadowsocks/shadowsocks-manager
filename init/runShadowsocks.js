const log4js = require('log4js');
const logger = log4js.getLogger('system');

const config = appRequire('services/config').all();

const spawn = require('child_process').spawn;

const run = async () => {
  let runParams = config.runShadowsocks;
  let type = 'libev';
  let method = 'aes-256-cfb';
  if(!runParams) {
    return;
  }
  if(typeof runParams === 'boolean' && runParams) {
    runParams = '';
  }
  if(runParams.indexOf(':') >= 0) {
    method = runParams.split(':')[1];
  }
  let shadowsocks;
  if(runParams.indexOf('python') >= 0) {
    type = 'python';
    const tempPassword = 'qwerASDF' + Math.random().toString().substr(2, 8);
    shadowsocks = spawn('ssserver', ['-m', method, '-p', '65535', '-k', tempPassword, '--manager-address', config.shadowsocks.address]);
  } else {
    shadowsocks = spawn('ss-manager', [ '-v', '-m', method, '-u', '--manager-address', config.shadowsocks.address]);
  }

  shadowsocks.stdout.on('data', (data) => {
    // console.log(`stdout: ${data}`);
  });

  shadowsocks.stderr.on('data', (data) => {
    // console.error(`stderr: ${data}`);
  });

  shadowsocks.on('close', (code) => {
    logger.error(`child process exited with code ${code}`);
  });
  logger.info(`Run shadowsocks (${ type === 'python' ? 'python' : 'libev'})`);
  return;
};

exports.run = run;
