const log4js = require('log4js');
const logger = log4js.getLogger('system');

const config = appRequire('services/config').all();

const spawn = require('child_process').spawn;

const run = async () => {
  let runParams = config.runShadowsocks;
  let type = 'libev';
  let method = 'aes-256-cfb';
  let plugin = config.ssPlugin;
  let pluginOpts = config.ssPluginOpts;

  if (!runParams) {
    return;
  }
  if (runParams === true) {
    runParams = '';
  }
  if (runParams.indexOf(':') >= 0) {
    method = runParams.split(':')[1];
  }

  let moreArgs = [];
  if (plugin) {
    moreArgs.push('--plugin');
    if (plugin !== true) {
      moreArgs.push(plugin);
    }
    if (pluginOpts) {
      moreArgs.push('--plugin-opts');
      if (pluginOpts !== true) {
        moreArgs.push(pluginOpts);
      }
    }
  }

  if (config.ssFastOpen) {
    moreArgs.push('--fast-open');
  }
  if (config.ssNoDelay) {
    moreArgs.push('--no-delay');
  }

  let shadowsocks;
  if (runParams.indexOf('python') >= 0) {
    type = 'python';
    const tempPassword = Math.random()
      .toString(36)
      .slice(2); //better random password generator
    shadowsocks = spawn('ssserver', [
      '-m',
      method,
      '-p',
      '65535',
      '-k',
      tempPassword,
      '--manager-address',
      config.shadowsocks.address,
      ...moreArgs,
    ]);
  } else {
    shadowsocks = spawn('ss-manager', [
      '-m',
      method,
      '-u',
      '--manager-address',
      config.shadowsocks.address,
      ...moreArgs,
    ]);
  }

  shadowsocks.stdout.on('data', data => {
    // console.log(`stdout: ${data}`);
  });

  shadowsocks.stderr.on('data', data => {
    // console.error(`stderr: ${data}`);
  });

  shadowsocks.on('close', code => {
    console.log(`child process exited with code ${code}`);
  });
  logger.info(`Run shadowsocks (${type === 'python' ? 'python' : 'libev'})`);
  return;
};

exports.run = run;
