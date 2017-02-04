'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('webgui');

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
const app = express();

app.use(bodyParser.json());
app.use(expressValidator());
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: '5E14cd8749A',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, maxAge: 5 * 24 * 60 * 60 * 1000 },
  store
}));

app.engine('.html', require('ejs').__express);
app.set('view engine', 'html');
app.set('views', path.resolve('./plugins/webgui/views'));

app.use('/libs', express.static(path.resolve('./plugins/webgui/libs')));
app.use('/public', express.static(path.resolve('./plugins/webgui/public')));

const port = 8080 || config.plugins.webgui.port;
const host = '0.0.0.0' || config.plugins.webgui.host;
app.listen(port, host, () => {
  logger.info(`server start at ${ host }:${ port }`);
});

exports.app = app;

appRequire('plugins/webgui/server/route');