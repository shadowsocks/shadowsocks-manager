const path = require('path');

global.appRequire = (filePath) => {
  return require(path.resolve(__dirname, '../' + filePath));
};
