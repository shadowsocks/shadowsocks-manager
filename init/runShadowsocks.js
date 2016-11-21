'use strict';

const config = appRequire('services/config').all();

const spawn = require('child_process').spawn;

const run = (type) => {
  let shadowsocks;
  if(type === 'python') {
    shadowsocks = spawn('ssserver', [ '-p', '65535', '-k', 'qwerASDF395745725', config.shadowsocks.address]);
  } else {
    shadowsocks = spawn('ss-manager', [ '-m', 'aes-256-cfb', '-u', '--manager-address', config.shadowsocks.address]);
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
};

exports.run = run;
