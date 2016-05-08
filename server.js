var async = require('async');
var load = require('./server/app');
async.waterfall([
    load.log4js,
    load.db,
    load.express,
]);
