const fs = require('fs');
const path = require('path');
const init = async () => {
  const files = fs.readdirSync(path.resolve(__dirname, '../models'));
  if(!files) {
    return Promise.reject('load models error');
  }
  for (let file of files) {
    await appRequire('models/' + file).createTable();
  }
  return;
};

exports.init = init;
