'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const log4js = require('log4js');
const logger = log4js.getLogger('system');

const config = appRequire('services/config').all();

const spawn = require('child_process').spawn;

const run = (() => {
  var _ref = _asyncToGenerator(function* () {
    let runParams = config.runShadowsocks;
    let type = 'libev';
    let method = 'aes-256-cfb';
    if (typeof runParams === 'boolean' && !runParams) {
      return;
    }
    if (typeof runParams === 'boolean' && runParams) {
      runParams = '';
    }
    if (runParams.indexOf(':') >= 0) {
      method = runParams.split(':')[1];
    }
    let shadowsocks;
    if (runParams.indexOf('python') >= 0) {
      type = 'python';
      shadowsocks = spawn('ssserver', ['-m', method, '-p', '65535', '-k', 'qwerASDF395745725', '--manager-address', config.shadowsocks.address]);
    } else {
      shadowsocks = spawn('ss-manager', ['-m', method, '-u', '--manager-address', config.shadowsocks.address]);
    }

    shadowsocks.stdout.on('data', function (data) {
      // console.log(`stdout: ${data}`);
    });

    shadowsocks.stderr.on('data', function (data) {
      // console.log(`stderr: ${data}`);
    });

    shadowsocks.on('close', function (code) {
      console.log(`child process exited with code ${code}`);
    });
    logger.info(`Run shadowsocks (${type === 'python' ? 'python' : 'libev'})`);
    return;
  });

  return function run() {
    return _ref.apply(this, arguments);
  };
})();

exports.run = run;