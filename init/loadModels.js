'use strict';

const fs = require('fs');
const init = async () => {
  const list = fs.readdirSync('./models');
  if(!list) {
    return Promise.reject('load models error');
  }
  for (let l of list) {
    await appRequire('models/' + l).createTable();
  }
  return;
};

exports.init = init;
