const log4js = require('log4js');
const logger = log4js.getLogger('webgui');
const expressLogger = log4js.getLogger('express');

const config = appRequire('services/config').all();
const os = require('os');
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
const cors = require('cors');

app.set('trust proxy', 'loopback');
app.use(log4js.connectLogger(expressLogger, {
  level: 'auto',
  format: '[:req[host]] [:req[x-real-ip]] :method :status :response-timems :url',
}));

if(config.plugins.webgui.cors) {
  const whitelist = config.plugins.webgui.cors;
  const corsOptions = {
    origin: whitelist,
    methods: ['GET', 'PUT', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  };
  app.use(cors(corsOptions));
}

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
app.use('/public/views/skin', express.static(path.resolve(os.homedir(), './.ssmgr/skin')));

app.use('/api/*', (req, res, next) => {
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

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

app.use((err, req, res, next) => res.render('error'));

exports.app = app;
// exports.wss = wss;
// exports.sessionParser = sessionParser;
// exports.dependence = ['webgui_ref', 'group', 'macAccount', 'webgui_order'];

appRequire('plugins/webgui/server/route');
