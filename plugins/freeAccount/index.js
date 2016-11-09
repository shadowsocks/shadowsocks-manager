'use strict';

const config = appRequire('services/config').all();
const path = require('path');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const compression = require('compression');
const expressValidator = require('express-validator');
const app =  express();

app.use(bodyParser.json());
app.use(expressValidator());
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: '6d4CEb870aF',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: true }
}));

app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.set('views', path.resolve('./plugins/freeAccount/views'));

app.use('/libs', express.static(path.resolve('./plugins/freeAccount/libs')));
app.use('/public', express.static(path.resolve('./plugins/freeAccount/public')));

const httpserver = app.listen(config.plugins.freeAccount.port, '0.0.0.0', function () {});

exports.app = app;

appRequire('plugins/freeAccount/server/route');
appRequire('plugins/freeAccount/server/account');
