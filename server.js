var async = require('async');
var load = require('./server/app');
var gulpTask = require('./gulpfile');
async.waterfall([
    load.log4js,
    load.db,
    load.express,
]);
