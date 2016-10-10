'use strict';

const fs = require('fs');
const init = async () => {
  const list = fs.readdirSync('./models');
  if(!list) {
    return Promise.reject('load models error');
  }
  list.forEach(f => {
    
  });
};

exports.init = init;
