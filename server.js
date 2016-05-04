var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/Shadowsocks-Manager');

require('./server/models/server');
require('./server/models/user');


var express = global.express = require('express');
var app = global.app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
app.use(session({
    secret: 'foo',
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    resave: false,
    saveUninitialized: false
}));

require('./server/app');



var server = app.listen(6003, function () {});