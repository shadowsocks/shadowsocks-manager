var version = require('../package.json').version;
var express = global.express = require('express');
var expressValidator = require('express-validator');
var app = global.app = express();
var compression = require('compression');
var config = require('../config').conf;
var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;
var mongoAuth = {};
if(config.db.user) {mongoAuth.user = config.db.user;}
if(config.db.pass) {mongoAuth.pass = config.db.pass;}
mongoose.connect('mongodb://' + config.db.host + ':' + config.db.port + '/' + config.db.name, mongoAuth);
var moment = require('moment-timezone');
moment().tz('Asia/Shanghai').format();

var fs = require('fs');
var http = require('http');
var https = require('https');

var log4js = require('log4js');
var logger = log4js.getLogger('server');
var loggerExpress = log4js.getLogger('express');
app.use(log4js.connectLogger(loggerExpress, 
    '[:remote-addr][:method][:url][:status][:response-time ms]'
));

logger.info('当前程序版本：' + version);

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
        }, {
            type: 'dateFile',
            filename: 'logs/express.log',
            pattern: '-yyyy-MM-dd',
            alwaysIncludePattern: true,
            category: 'express'
        }, {
            type: 'dateFile',
            filename: 'logs/system.log',
            pattern: '-yyyy-MM-dd',
            alwaysIncludePattern: true,
            category: 'system'
        },]
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
    if(config.express.key && config.express.cert) {
        var httpskey = fs.readFileSync(config.express.key);
        var httpscert = fs.readFileSync(config.express.cert);
    }
    // app.enable('trust proxy');
    var bodyParser = require('body-parser');
    app.use(bodyParser.json());
    app.use(expressValidator());
    app.use(compression());
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

    logger.info('开始加载Express路由配置文件');
    fs.readdir('./server/routes', function(err, files) {
        if(err) {logger.error(err);}
        files.forEach(function(file) {
            require('../server/routes/' + file);
            logger.info('加载路由文件 ' + file);
        });
        var httpserver = app.listen(config.express.http, '0.0.0.0', function () {
            logger.info('http 服务启动，监听端口 ' + config.express.http);
        });
        if(config.express.key && config.express.cert) {
            var httpsserver = https.createServer({
                key: httpskey,
                cert: httpscert
            }, app).listen(config.express.https, function() {
                logger.info('https服务启动，监听端口 ' + config.express.https);
            });
        }
        cb(null);
    });
};