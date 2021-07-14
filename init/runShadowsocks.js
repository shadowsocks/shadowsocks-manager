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
  if(runParams.includes(':')) {
    method = runParams.split(':')[1];
  }
  const pluginOptions = [
    ...(config.shadowsocks['plugin'] ? ['--plugin', config.shadowsocks['plugin']] : []),
    ...(config.shadowsocks['plugin-opts'] ? ['--plugin-opts', config.shadowsocks['plugin-opts']] : []),
  ];
  let shadowsocks;
  if(runParams.includes('python')) {
    type = 'python';
    const tempPassword = 'qwerASDF' + Math.random().toString().substr(2, 8);
    // there is no SIP003 support in the python port, so just ignore the pluginOptions
    shadowsocks = spawn('ssserver', ['-m', method, '-p', '65535', '-k', tempPassword, '--manager-address', config.shadowsocks.address]);
  } else if(runParams.includes('rust')) {
    type = 'rust';
    shadowsocks = spawn('ssmanager', [ '-m', method, '-U', '--manager-address', config.shadowsocks.address, ...pluginOptions]);
  } else {
    shadowsocks = spawn('ss-manager', [ '-v', '-m', method, '-u', '--manager-address', config.shadowsocks.address, ...pluginOptions]);
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
  logger.info(`Run shadowsocks (${type})`);
  return;
};

exports.run = run;
