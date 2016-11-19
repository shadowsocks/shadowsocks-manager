'use strict';

const config = appRequire('services/config').all();

const spawn = require('child_process').spawn;
const shadowsocks = spawn('ss-manager', [ '-m', 'aes-256-cfb', '-u', '--manager-address', config.shadowsocks.address]);

shadowsocks.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

shadowsocks.stderr.on('data', (data) => {
  console.log(`stderr: ${data}`);
});

shadowsocks.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
