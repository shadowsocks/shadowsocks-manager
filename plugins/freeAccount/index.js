'use strict';

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const expressValidator = require('express-validator');
const app =  express();

app.use(bodyParser.json());
app.use(expressValidator());
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));

app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.set('views', path.resolve('./plugins/freeAccount/views'));

app.use('/public', express.static(path.resolve('./plugins/freeAccount/public')));

const httpserver = app.listen(80, '0.0.0.0', function () {

});

exports.app = app;
appRequire('plugins/freeAccount/server/app');
