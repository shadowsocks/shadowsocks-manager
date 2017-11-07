const app = appRequire('plugins/webgui/index').app;
// const wss = appRequire('plugins/webgui/index').wss;
const sessionParser = appRequire('plugins/webgui/index').sessionParser;
const home = appRequire('plugins/webgui/server/home');
const user = appRequire('plugins/webgui/server/user');
const admin = appRequire('plugins/webgui/server/admin');
const adminUser = appRequire('plugins/webgui/server/adminUser');
const adminServer = appRequire('plugins/webgui/server/adminServer');
const adminFlow = appRequire('plugins/webgui/server/adminFlow');
const adminSetting = appRequire('plugins/webgui/server/adminSetting');
const adminNotice = appRequire('plugins/webgui/server/adminNotice');
const adminAccount = appRequire('plugins/webgui/server/adminAccount');
const push = appRequire('plugins/webgui/server/push');
const os = require('os');
const path = require('path');
const knex = appRequire('init/knex').knex;
const config = appRequire('services/config').all();

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
app.post('/api/home/macLogin', home.macLogin);
app.post('/api/home/logout', home.logout);
app.post('/api/home/password/sendEmail', home.sendResetPasswordEmail);
app.get('/api/home/password/reset', home.checkResetPasswordToken);
app.post('/api/home/password/reset', home.resetPassword);

app.get('/api/admin/server', isAdmin, adminServer.getServers);
app.get('/api/admin/server/:serverId(\\d+)', isAdmin, adminServer.getOneServer);
app.post('/api/admin/server', isAdmin, adminServer.addServer);
app.put('/api/admin/server/:serverId(\\d+)', isAdmin, adminServer.editServer);
app.delete('/api/admin/server/:serverId(\\d+)', isAdmin, adminServer.deleteServer);

app.get('/api/admin/account', isAdmin, admin.getAccount);
app.get('/api/admin/account/port/:port(\\d+)', isAdmin, admin.getAccountByPort);
app.get('/api/admin/account/:accountId(\\d+)', isAdmin, admin.getOneAccount);
app.get('/api/admin/account/:serverId(\\d+)/:accountId(\\d+)/ip', isAdmin, admin.getAccountIp);
app.get('/api/admin/account/ip/:ip', isAdmin, admin.getAccountIpInfo);
app.get('/api/admin/account/:accountId(\\d+)/ip', isAdmin, admin.getAccountIpFromAllServer);
app.post('/api/admin/account', isAdmin, admin.addAccount);
app.put('/api/admin/account/:accountId(\\d+)/port', isAdmin, admin.changeAccountPort);
app.put('/api/admin/account/:accountId(\\d+)/data', isAdmin, admin.changeAccountData);
app.delete('/api/admin/account/:accountId(\\d+)', isAdmin, admin.deleteAccount);

app.get('/api/admin/account/mac', isAdmin, adminAccount.getMacAccount);
app.post('/api/admin/account/mac/:macAddress', isAdmin, adminAccount.addMacAccount);
app.put('/api/admin/account/mac', isAdmin, adminAccount.editMacAccount);
app.delete('/api/admin/account/mac', isAdmin, adminAccount.deleteMacAccount);

app.get('/api/user/account/mac/:macAddress', adminAccount.getMacAccountForUser);

app.get('/api/admin/flow/:serverId(\\d+)', isAdmin, adminFlow.getServerFlow);
app.get('/api/admin/flow/:serverId(\\d+)/lastHour', isAdmin, adminFlow.getServerLastHourFlow);
app.get('/api/admin/flow/:serverId(\\d+)/user', isAdmin, adminFlow.getServerUserFlow);
app.get('/api/admin/flow/account/:accountId(\\d+)', isAdmin, adminFlow.getAccountServerFlow);
app.get('/api/admin/flow/:serverId(\\d+)/:accountId(\\d+)', isAdmin, adminFlow.getServerPortFlow);
app.get('/api/admin/flow/:serverId(\\d+)/:accountId(\\d+)/lastConnect', isAdmin, adminFlow.getServerPortLastConnect);

app.get('/api/admin/user', isAdmin, adminUser.getUsers);
app.post('/api/admin/user/add', isAdmin, adminUser.addUser);
app.get('/api/admin/user/recentSignUp', isAdmin, admin.getRecentSignUpUsers);
app.get('/api/admin/user/recentLogin', isAdmin, admin.getRecentLoginUsers);

app.get('/api/admin/user/account', isAdmin, admin.getUserAccount);
app.get('/api/admin/user/:userId(\\d+)', isAdmin, admin.getOneUser);
app.post('/api/admin/user/:userId(\\d+)/sendEmail', isAdmin, admin.sendUserEmail);
app.put('/api/admin/user/:userId(\\d+)/:accountId(\\d+)', isAdmin, admin.setUserAccount);
app.delete('/api/admin/user/:userId(\\d+)', isAdmin, admin.deleteUser);
app.delete('/api/admin/user/:userId(\\d+)/:accountId(\\d+)', isAdmin, admin.deleteUserAccount);
app.get('/api/admin/user/:accountId(\\d+)/lastConnect', isAdmin, admin.getUserPortLastConnect);

app.get('/api/admin/alipay', isAdmin, admin.getOrders);
app.get('/api/admin/alipay/recentOrder', isAdmin, admin.getRecentOrders);
app.get('/api/admin/alipay/:userId(\\d+)', isAdmin, admin.getUserOrders);
app.get('/api/admin/paypal', isAdmin, admin.getPaypalOrders);
app.get('/api/admin/paypal/recentOrder', isAdmin, admin.getPaypalRecentOrders);
app.get('/api/admin/paypal/:userId(\\d+)', isAdmin, admin.getPaypalUserOrders);

app.get('/api/admin/notice', isAdmin, adminNotice.getNotice);
app.get('/api/admin/notice/:noticeId(\\d+)', isAdmin, adminNotice.getOneNotice);
app.post('/api/admin/notice', isAdmin, adminNotice.addNotice);
app.put('/api/admin/notice/:noticeId(\\d+)', isAdmin, adminNotice.editNotice);
app.delete('/api/admin/notice/:noticeId(\\d+)', isAdmin, adminNotice.deleteNotice);

app.get('/api/admin/setting/payment', isAdmin, adminSetting.getPayment);
app.put('/api/admin/setting/payment', isAdmin, adminSetting.modifyPayment);
app.get('/api/admin/setting/account', isAdmin, adminSetting.getAccount);
app.put('/api/admin/setting/account', isAdmin, adminSetting.modifyAccount);
app.get('/api/admin/setting/base', isAdmin, adminSetting.getBase);
app.put('/api/admin/setting/base', isAdmin, adminSetting.modifyBase);
app.get('/api/admin/setting/mail', isAdmin, adminSetting.getMail);
app.put('/api/admin/setting/mail', isAdmin, adminSetting.modifyMail);

app.get('/api/user/notice', isUser, user.getNotice);
app.get('/api/user/account', isUser, user.getAccount);
app.get('/api/user/account/:accountId(\\d+)', isUser, user.getOneAccount);
app.get('/api/user/server', isUser, user.getServers);
app.get('/api/user/flow/:serverId(\\d+)/:accountId(\\d+)', isUser, user.getServerPortFlow);
app.get('/api/user/flow/:serverId(\\d+)/:accountId(\\d+)/lastConnect', isUser, user.getServerPortLastConnect);
app.put('/api/user/:accountId(\\d+)/password', isUser, user.changeShadowsocksPassword);
app.get('/api/user/multiServerFlow', isUser, user.getMultiServerFlowStatus);

app.get('/api/user/status/alipay', isUser, user.getAlipayStatus);

app.get('/api/user/order/price', isUser, user.getPrice);
app.post('/api/user/order/qrcode', isUser, user.createOrder);
app.post('/api/user/order/status', isUser, user.checkOrder);

app.post('/api/user/paypal/create', isUser, user.createPaypalOrder);
app.post('/api/user/paypal/execute', isUser, user.executePaypalOrder);

app.post('/api/user/alipay/callback', user.alipayCallback);
app.post('/api/user/paypal/callback', user.paypalCallback);

app.post('/api/user/changePassword', user.changePassword);

if(config.plugins.webgui.gcmAPIKey && config.plugins.webgui.gcmSenderId) {
  app.post('/api/push/client', push.client);
  app.delete('/api/push/client', push.deleteClient);
}

app.get('/favicon.png', (req, res) => {
  let file = './libs/favicon.png';
  let options = {
    root: './plugins/webgui/'
  };
  const iconPath = config.plugins.webgui.icon;
  if(iconPath) {
    const ssmgrPath = path.resolve(os.homedir(), './.ssmgr/');
    if (iconPath[0] === '/' || iconPath[0] === '.') {
      options = {};
      file = path.resolve(iconPath);
    } else if (iconPath[0] === '~') {
      file = '.' + iconPath.substr(1);
      options.root = os.homedir();
    } else {
      file = iconPath;
      options.root = ssmgrPath;
    }
  }
  res.sendFile(file, options);
});

const manifest = appRequire('plugins/webgui/views/manifest').manifest;
app.get('/manifest.json', (req, res) => {
  return knex('webguiSetting').select().where({
    key: 'base',
  }).then(success => {
    if(!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value;
  }).then(success => {
    manifest.name = success.title;
    return res.json(manifest);
  });
});

const version = appRequire('package').version;
const configForFrontend = {
  site: config.plugins.webgui.site,
  alipay: config.plugins.alipay && config.plugins.alipay.use,
  paypal: config.plugins.paypal && config.plugins.paypal.use,
  paypalMode: config.plugins.paypal && config.plugins.paypal.mode,
  macAccount: config.plugins.macAccount && config.plugins.macAccount.use,
};

const cdn = config.plugins.webgui.cdn;
const analytics = config.plugins.webgui.googleAnalytics || '';
const colors = [
  { value: 'red', color: '#F44336' },
  { value: 'pink', color: '#E91E63' },
  { value: 'purple', color: '#9C27B0' },
  { value: 'deep-purple', color: '#673AB7' },
  { value: 'indigo', color: '#3F51B5' },
  { value: 'blue', color: '#2196F3' },
  { value: 'light-blue', color: '#03A9F4' },
  { value: 'cyan', color: '#00BCD4' },
  { value: 'teal', color: '#009688' },
  { value: 'green', color: '#4CAF50' },
  { value: 'light-green', color: '#8BC34A' },
  { value: 'lime', color: '#CDDC39' },
  { value: 'yellow', color: '#FFEB3B' },
  { value: 'amber', color: '#FFC107' },
  { value: 'orange', color: '#FF9800' },
  { value: 'deep-orange', color: '#FF5722' },
  { value: 'brown', color: '#795548' },
  { value: 'blue-grey', color: '#607D8B' },
  { value: 'grey', color: '#9E9E9E' },
];
const homePage = (req, res) => {
  return knex('webguiSetting').select().where({
    key: 'base',
  }).then(success => {
    if(!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value;
  }).then(success => {
    configForFrontend.title = success.title;
    configForFrontend.themePrimary = success.themePrimary;
    configForFrontend.themeAccent = success.themeAccent;
    const filterColor = colors.filter(f => f.value === success.themePrimary);
    configForFrontend.browserColor = filterColor[0] ? filterColor[0].color : '#3F51B5';
    return res.render('index', {
      title: success.title,
      version,
      cdn,
      analytics,
      config: configForFrontend,
      paypal: !!(config.plugins.paypal && config.plugins.paypal.use),
    });
  });
};
app.get('/', homePage);
app.get(/^\/home\//, homePage);
app.get(/^\/admin\//, homePage);
app.get(/^\/user\//, homePage);

app.get('/serviceworker.js', (req, res) => {
  return knex('webguiSetting').select().where({
    key: 'base',
  }).then(success => {
    if(!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value;
  }).then(success => {
    res.header('Content-Type', 'text/javascript');
    res.render('serviceworker.js', {
      serviceWorker: !!success.serviceWorker,
      serviceWorkerTime: success.serviceWorkerTime,
    });
  });
  
});

app.get('*', (req, res) => {
  res.redirect('/');
});

// wss.on('connection', function connection(ws) {
//   // console.log(ws);
//   ws.on('message', function incoming(message) {
//     console.log('received: %s', message);
//   });
//   ws.send('ws connected');
// });

