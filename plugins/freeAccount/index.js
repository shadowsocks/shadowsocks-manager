'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('freeAccount');

const config = appRequire('services/config').all();
const path = require('path');
const express = require('express');
const session = require('express-session');
const knex = appRequire('init/knex').knex;
const KnexSessionStore = require('connect-session-knex')(session);
const store = new KnexSessionStore({ knex });
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
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, maxAge: 5 * 24 * 60 * 60 * 1000 },
  store,
}));

app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.set('views', path.resolve('./plugins/freeAccount/views'));

app.use('/libs', express.static(path.resolve('./plugins/freeAccount/libs')));
app.use('/public', express.static(path.resolve('./plugins/freeAccount/public')));

app.listen(config.plugins.freeAccount.port, '0.0.0.0', function () {});

exports.app = app;

appRequire('plugins/freeAccount/server/route');
appRequire('plugins/freeAccount/server/account');
