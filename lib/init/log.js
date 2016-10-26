'use strict';

const log4js = require('log4js');
log4js.configure({
    appenders: [{
        type: 'console',
        category: 'init'
    }]
});