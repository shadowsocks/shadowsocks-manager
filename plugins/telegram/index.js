'use strict';

const rp = require('request-promise');
const config = appRequire('services/config').all();
const token = config.plugins.telegram.token;

const url = `https://api.telegram.org/bot${ token }/getUpdates`;

const getMessages = () => {
  return rp({
    method: 'GET',
    uri: url,
    simple: false,
  }).then(result => {
    console.log(result);
  }).catch(err => {
    console.log(err);
  });
};

getMessages();
