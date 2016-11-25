'use strict';

const log4js = require('log4js');
log4js.configure({
  appenders: [{
    type: 'console',
    category: 'system'
  }, {
    type: 'console',
    category: 'email'
  }, {
    type: 'console',
    category: 'telegram'
  }, {
    type: 'console',
    category: 'freeAccount'
  }]
});