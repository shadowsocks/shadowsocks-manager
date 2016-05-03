var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/Shadowsocks-Manager');

require('./server/models/server');
require('./server/models/user');


var express = global.express = require('express');
var app = global.app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
require('./server/app');

var server = app.listen(6003, function () {});