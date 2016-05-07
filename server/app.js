require('./routes/login');
require('./routes/admin');
var express = global.express;
var app = global.app;


app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.use('/libs', express.static('./bower_components'));
app.use('/public', express.static('./public'));

var config = require('../config').conf;
var fs = require('fs');

var log4js = exports.log4js = function() {
    var log4js = require('log4js');
    log4js.configure({
        appenders: [{
            type: 'console',
            category: 'server'
        }, {
            type: 'dateFile',
            filename: 'logs/server.log',
            pattern: '-yyyy-MM-dd',
            alwaysIncludePattern: true,
            category: 'server'
        }]
    });
    var logger = log4js.getLogger('server');
    logger.info('加载log4js');
};
log4js();
var logger = log4js.getLogger('server');

exports.db = function () {
    // var mongoose = require('mongoose');
    // mongoose.connect('mongodb://localhost/Shadowsocks-Manager');
    fs.readdir('./server/models', function(err, files) {
        console.log(err);
        console.log(files);
    });
};

exports.express = function() {
    
};