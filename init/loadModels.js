'use strict';

const fs = require('fs');
const path = require('path');
const init = async () => {
  const list = fs.readdirSync(path.resolve(__dirname, '../models'));
  if(!list) {
    return Promise.reject('load models error');
  }
  for (let l of list) {
    await appRequire('models/' + l).createTable();
  }
  return;
};

exports.init = init;
