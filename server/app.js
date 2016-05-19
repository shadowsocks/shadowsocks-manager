var express = global.express = require('express');
var app = global.app = express();
var config = require('../config').conf;
var mongoose = require('mongoose');
mongoose.connect('mongodb://' + config.db.host + ':' + config.db.port + '/' + config.db.name);

var fs = require('fs');

var log4js = require('log4js');
var logger = log4js.getLogger('server');

var log4js = exports.log4js = function(cb) {
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
        }, {
            type: 'console',
            category: 'admin'
        }, {
            type: 'dateFile',
            filename: 'logs/admin.log',
            pattern: '-yyyy-MM-dd',
            alwaysIncludePattern: true,
            category: 'admin'
        },
        // {
        //     type: 'console',
        //     category: 'shadow'
        // },
        {
            type: 'dateFile',
            filename: 'logs/shadow.log',
            pattern: '-yyyy-MM-dd',
            alwaysIncludePattern: true,
            category: 'shadow'
        }, {
            type: 'console',
            category: 'auth'
        }, {
            type: 'dateFile',
            filename: 'logs/auth.log',
            pattern: '-yyyy-MM-dd',
            alwaysIncludePattern: true,
            category: 'auth'
        }]
    });
    cb(null);
};


exports.db = function (cb) {
    logger.info('开始加载数据库配置文件');
    fs.readdir('./server/models', function(err, files) {
        if(err) {logger.error(err);}
        files.forEach(function(file) {
            require('../server/models/' + file);
            logger.info('加载数据库 ' + file);
        });
        cb(err);
    });
};

exports.express = function(cb) {

    var bodyParser = require('body-parser');
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    var session = require('express-session');
    var MongoStore = require('connect-mongo')(session);
    app.use(session({
        secret: 'foo',
        store: new MongoStore({ mongooseConnection: mongoose.connection }),
        resave: false,
        saveUninitialized: false
    }));

    app.engine('.html', require('ejs').__express);
    app.set('view engine', 'html');
    app.set('views', __dirname + '/views');

    app.use('/libs', express.static('./bower_components'));
    app.use('/public', express.static('./public'));

    require('./routes/login');
    require('./routes/admin');

    logger.info('开始加载Express路由配置文件');
    fs.readdir('./server/routes', function(err, files) {
        if(err) {logger.error(err);}
        files.forEach(function(file) {
            require('../server/routes/' + file);
            logger.info('加载路由文件 ' + file);
        });
        var server = app.listen(config.express.port, function () {
            logger.info('Web服务启动，监听端口 ' + config.express.port);
        });
        cb(null);
    });
};