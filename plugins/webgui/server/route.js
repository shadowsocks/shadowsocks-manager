'use strict';

const app = appRequire('plugins/webgui/index').app;
// const wss = appRequire('plugins/webgui/index').wss;
const sessionParser = appRequire('plugins/webgui/index').sessionParser;
const home = appRequire('plugins/webgui/server/home');
const user = appRequire('plugins/webgui/server/user');
const admin = appRequire('plugins/webgui/server/admin');
const adminSetting = appRequire('plugins/webgui/server/adminSetting');
const adminNotice = appRequire('plugins/webgui/server/adminNotice');
const push = appRequire('plugins/webgui/server/push');
const path = require('path');
const knex = appRequire('init/knex').knex;

const isUser = (req, res, next) => {
  if(req.session.type === 'normal') {
    knex('user').update({
      lastLogin: Date.now(),
    }).where({ id: req.session.user }).then();
    return next();
  } else {
    return res.status(401).end();
  }
};
const isAdmin = (req, res, next) => {
  if(req.session.type === 'admin') {
    return next();
  } else {
    return res.status(401).end();
  }
};

app.get('/api/home/login', home.status);
app.post('/api/home/code', home.sendCode);
app.post('/api/home/signup', home.signup);
app.post('/api/home/login', home.login);
app.post('/api/home/logout', home.logout);
app.post('/api/home/password/sendEmail', home.sendResetPasswordEmail);
app.get('/api/home/password/reset', home.checkResetPasswordToken);
app.post('/api/home/password/reset', home.resetPassword);

app.get('/api/admin/server', isAdmin, admin.getServers);
app.get('/api/admin/server/:serverId(\\d+)', isAdmin, admin.getOneServer);
app.post('/api/admin/server', isAdmin, admin.addServer);
app.put('/api/admin/server/:serverId(\\d+)', isAdmin, admin.editServer);
app.delete('/api/admin/server/:serverId(\\d+)', isAdmin, admin.deleteServer);

app.get('/api/admin/account', isAdmin, admin.getAccount);
app.get('/api/admin/account/port/:port(\\d+)', isAdmin, admin.getAccountByPort);
app.get('/api/admin/account/:accountId(\\d+)', isAdmin, admin.getOneAccount);
app.post('/api/admin/account', isAdmin, admin.addAccount);
app.put('/api/admin/account/:accountId(\\d+)/port', isAdmin, admin.changeAccountPort);
app.put('/api/admin/account/:accountId(\\d+)/data', isAdmin, admin.changeAccountData);
app.delete('/api/admin/account/:accountId(\\d+)', isAdmin, admin.deleteAccount);

app.get('/api/admin/flow/:serverId(\\d+)', isAdmin, admin.getServerFlow);
app.get('/api/admin/flow/:serverId(\\d+)/lastHour', isAdmin, admin.getServerLastHourFlow);
app.get('/api/admin/flow/:serverId(\\d+)/user', isAdmin, admin.getServerUserFlow);
app.get('/api/admin/flow/account/:accountId(\\d+)', isAdmin, admin.getAccountServerFlow);
app.get('/api/admin/flow/:serverId(\\d+)/:port(\\d+)', isAdmin, admin.getServerPortFlow);
app.get('/api/admin/flow/:serverId(\\d+)/:port(\\d+)/lastConnect', isAdmin, admin.getServerPortLastConnect);

app.get('/api/admin/user', isAdmin, admin.getUsers);
app.get('/api/admin/user/recentSignUp', isAdmin, admin.getRecentSignUpUsers);
app.get('/api/admin/user/recentLogin', isAdmin, admin.getRecentLoginUsers);
app.get('/api/admin/user/account', isAdmin, admin.getUserAccount);
app.get('/api/admin/user/:userId(\\d+)', isAdmin, admin.getOneUser);
app.put('/api/admin/user/:userId(\\d+)/:accountId(\\d+)', isAdmin, admin.setUserAccount);
app.delete('/api/admin/user/:userId(\\d+)/:accountId(\\d+)', isAdmin, admin.deleteUserAccount);
app.get('/api/admin/user/:port(\\d+)/lastConnect', isAdmin, admin.getUserPortLastConnect);

app.get('/api/admin/order', isAdmin, admin.getOrders);
app.get('/api/admin/order/:userId(\\d+)', isAdmin, admin.getUserOrders);

app.get('/api/admin/notice', isAdmin, adminNotice.getNotice);
app.get('/api/admin/notice/:noticeId(\\d+)', isAdmin, adminNotice.getOneNotice);
app.post('/api/admin/notice', isAdmin, adminNotice.addNotice);
app.put('/api/admin/notice/:noticeId(\\d+)', isAdmin, adminNotice.editNotice);
app.delete('/api/admin/notice/:noticeId(\\d+)', isAdmin, adminNotice.deleteNotice);

app.get('/api/admin/setting', isAdmin, adminSetting.getSetting);
app.put('/api/admin/setting', isAdmin, adminSetting.modifySetting);

app.get('/api/user/notice', isUser, user.getNotice);
app.get('/api/user/account', isUser, user.getAccount);
app.get('/api/user/account/:accountId(\\d+)', isUser, user.getOneAccount);
app.get('/api/user/server', isUser, user.getServers);
app.get('/api/user/flow/:serverId(\\d+)/:port(\\d+)', isUser, user.getServerPortFlow);
app.get('/api/user/flow/:serverId(\\d+)/:port(\\d+)/lastConnect', isUser, user.getServerPortLastConnect);
app.put('/api/user/:accountId(\\d+)/password', isUser, user.changePassword);
app.get('/api/user/multiServerFlow', isUser, user.getMultiServerFlowStatus);

app.get('/api/user/status/alipay', isUser, user.getAlipayStatus);

app.get('/api/user/order/price', isUser, user.getPrice);
app.post('/api/user/order/qrcode', isUser, user.createOrder);
app.post('/api/user/order/status', isUser, user.checkOrder);

app.post('/api/user/alipay/callback', user.alipayCallback);

app.post('/api/push/client', push.client);

app.get('/serviceworker.js', (req, res) => {
  res.header('Content-Type', 'text/javascript');
  res.sendFile('serviceworker.js', {
    root: path.resolve(__dirname, '../public/'),
  }, err => {
    if (err) {
      console.log(err);
      return res.status(404).end();
    }
  });
});

const manifest = appRequire('plugins/webgui/views/manifest').manifest;
app.get('/manifest.json', (req, res) => {
  return res.json(manifest);
});

const version = appRequire('package').version;
const homePage = (req, res) => res.render('index', { version });
app.get('/', homePage);
app.get(/^\/home\//, homePage);
app.get(/^\/admin\//, homePage);
app.get(/^\/user\//, homePage);

// wss.on('connection', function connection(ws) {
//   // console.log(ws);
//   ws.on('message', function incoming(message) {
//     console.log('received: %s', message);
//   });
//   ws.send('ws connected');
// });

// const shell = appRequire('plugins/webgui/server/shell');
// shell.getConnectionIp(10000).then(console.log).catch(err => {
//   console.log('err', err);
// });
