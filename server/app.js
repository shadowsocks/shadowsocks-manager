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

exports.log4js = function() {
    var log4js = require('log4js');
    var logger = log4js.getLogger();
    logger.info('log4js');
};

exports.db = function () {
    // var mongoose = require('mongoose');
    // mongoose.connect('mongodb://localhost/Shadowsocks-Manager');
    fs.readdir('./server/models', function(err, files) {
        console.log(err);
        console.log(files);
    });
};