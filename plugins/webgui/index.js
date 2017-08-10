const log4js = require('log4js');
const logger = log4js.getLogger('webgui');
const expressLogger = log4js.getLogger('express');

const config = appRequire('services/config').all();
const path = require('path');
const express = require('express');
// const WebSocketServer = require('ws').Server;
const session = require('express-session');
const knex = appRequire('init/knex').knex;
const KnexSessionStore = require('connect-session-knex')(session);
const store = new KnexSessionStore({ knex });
const sessionParser = session({
  secret: '5E14cd8749A',
  rolling: true,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 },
  store,
});
const bodyParser = require('body-parser');
const compression = require('compression');
const expressValidator = require('express-validator');
const app = express();

app.set('trust proxy', 'loopback');
app.use(log4js.connectLogger(expressLogger, {
  level: 'auto',
  format: '[:req[x-real-ip]] :method :status :response-timems :url',
}));

app.use(bodyParser.json());
app.use(expressValidator());
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(sessionParser);

app.engine('.html', require('ejs').__express);
app.engine('.js', require('ejs').__express);
app.set('view engine', 'html');
app.set('views', path.resolve('./plugins/webgui/views'));

app.use('/libs', express.static(path.resolve('./plugins/webgui/libs')));
app.use('/public', express.static(path.resolve('./plugins/webgui/public')));

const port = config.plugins.webgui.port || 8080;
const host = config.plugins.webgui.host || '0.0.0.0';
app.listen(port, host, () => {
  logger.info(`server start at ${ host }:${ port }`);
}).on('error', err => {
  logger.error('express server error: ' + err);
  process.exit(1);
});

// const wss = new WebSocketServer({
//   server,
//   path: '/user',
//   verifyClient: function (info, done){
//     sessionParser(info.req, {}, function (){
//       // console.log(info.req.session);
//       if(info.req.session.user && info.req.session.type === 'normal') {
//         done(true);
//       } else {
//         done(false);
//       }
//     });
//   }
// });

exports.app = app;
// exports.wss = wss;
// exports.sessionParser = sessionParser;

appRequire('plugins/webgui/server/route');
