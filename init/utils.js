const path = require('path');

global.appRequire = (filePath) => {
  return require(path.resolve(__dirname, '../' + filePath));
};

global.appFork = filePath => {
  const child = require('child_process');
  return child.fork(path.resolve(__dirname, '../' + filePath));
};
