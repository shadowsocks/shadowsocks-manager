const log4js = require('log4js');
const logger = log4js.getLogger('webgui');
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
const adminGiftCard = appRequire('plugins/webgui/server/adminGiftCard');
const adminGroup = appRequire('plugins/webgui/server/adminGroup');
const adminOrder = appRequire('plugins/webgui/server/adminOrder');
const push = appRequire('plugins/webgui/server/push');
const os = require('os');
const path = require('path');
const knex = appRequire('init/knex').knex;
const config = appRequire('services/config').all();

const isUser = (req, res, next) => {
  if (req.session.type === 'normal') {
    knex('user').where({ id: req.session.user, type: 'normal' }).then(s => s[0]).then(user => {
      if(!user) { return res.status(401).end(); }
      req.userInfo = user;
      return next();
    }).catch(err => {
      return res.status(401).end();
    });
  } else {
    return res.status(401).end();
  }
};

const isAdmin = (req, res, next) => {
  if (req.session.type === 'admin') {
    knex('user').where({ id: req.session.user, type: 'admin' }).then(s => s[0]).then(user => {
      if(!user) { return res.status(401).end(); }
      req.adminInfo = user;
      return next();
    }).catch(err => {
      return res.status(401).end();
    });
  } else {
    return res.status(401).end();
  }
};

const isSuperAdmin = (req, res, next) => {
  if(req.session.user !== 1) { return res.status(401).end(); }
  next();
};

app.get('/api/home/login', home.status);
app.post('/api/home/code', home.sendCode);
app.post('/api/home/ref/:refCode', home.visitRef);
app.post('/api/home/signup', home.signup);
app.post('/api/home/login', home.login);
app.post('/api/home/googleLogin', home.googleLogin);
app.post('/api/home/facebookLogin', home.facebookLogin);
app.post('/api/home/githubLogin', home.githubLogin);
app.get('/api/home/twitterLogin', home.getTwitterLoginUrl);
app.post('/api/home/twitterLogin', home.twitterLogin);
app.post('/api/home/macLogin', home.macLogin);
app.post('/api/home/logout', home.logout);
app.post('/api/home/password/sendEmail', home.sendResetPasswordEmail);
app.get('/api/home/password/reset', home.checkResetPasswordToken);
app.post('/api/home/password/reset', home.resetPassword);

app.get('/api/admin/server', isAdmin, adminServer.getServers);
app.get('/api/admin/server/:serverId(\\d+)', isAdmin, adminServer.getOneServer);
app.post('/api/admin/server', isAdmin, isSuperAdmin, adminServer.addServer);
app.put('/api/admin/server/:serverId(\\d+)', isAdmin, isSuperAdmin, adminServer.editServer);
app.delete('/api/admin/server/:serverId(\\d+)', isAdmin, isSuperAdmin, adminServer.deleteServer);

app.get('/api/admin/account', isAdmin, admin.getAccount);
app.post('/api/admin/accountWithPage', isAdmin, admin.getAccountAndPaging);
app.get('/api/admin/account/online', isAdmin, isSuperAdmin, admin.getOnlineAccount);
app.get('/api/admin/macAccount', isAdmin, admin.getAllMacAccount);
app.get('/api/admin/account/port/:port(\\d+)', isAdmin, admin.getAccountByPort);
app.get('/api/admin/account/:accountId(\\d+)', isAdmin, admin.getOneAccount);
app.get('/api/admin/account/:serverId(\\d+)/:accountId(\\d+)/ip', isAdmin, admin.getAccountIp);
app.get('/api/admin/account/:serverId(\\d+)/:accountId(\\d+)/ban', isSuperAdmin, adminAccount.getBanAccount);
app.post('/api/admin/account/:serverId(\\d+)/:accountId(\\d+)/ban', isSuperAdmin, adminAccount.banAccount);
app.get('/api/admin/account/ip/:ip', isAdmin, admin.getAccountIpInfo);
app.get('/api/admin/account/:accountId(\\d+)/ip', isAdmin, admin.getAccountIpFromAllServer);
app.post('/api/admin/account', isAdmin, isSuperAdmin, admin.addAccount);
app.get('/api/admin/account/newPort', isAdmin, isSuperAdmin, admin.newPortForAddAccount);
app.put('/api/admin/account/:accountId(\\d+)/port', isAdmin, isSuperAdmin, admin.changeAccountPort);
app.put('/api/admin/account/:accountId(\\d+)/data', isAdmin, isSuperAdmin, admin.changeAccountData);
app.put('/api/admin/account/:accountId(\\d+)/time', isAdmin, isSuperAdmin, admin.changeAccountTime);
app.delete('/api/admin/account/:accountId(\\d+)', isAdmin, isSuperAdmin, admin.deleteAccount);
app.post('/api/admin/account/:accountId(\\d+)/resetFlow', isAdmin, isSuperAdmin, admin.resetAccountFlow);

app.get('/api/admin/account/mac', isAdmin, adminAccount.getMacAccount);
app.post('/api/admin/account/mac/:macAddress', isAdmin, adminAccount.addMacAccount);
app.put('/api/admin/account/mac', isAdmin, adminAccount.editMacAccount);
app.delete('/api/admin/account/mac', isAdmin, adminAccount.deleteMacAccount);

app.get('/api/user/account/mac/:macAddress', adminAccount.getMacAccountForUser);
app.get('/api/user/account/subscribe/:token', adminAccount.getSubscribeAccountForUser);
app.get('/api/user/notice/mac/:macAddress', adminAccount.getNoticeForUser);

app.get('/api/admin/flow/:serverId(\\d+)', isAdmin, adminFlow.getServerFlow);
app.get('/api/admin/flow/top', isAdmin, adminFlow.getTopFlow);
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
app.get('/api/admin/user/:userId(\\d+)', isAdmin, adminUser.getOneUser);
app.get('/api/admin/admin/:userId(\\d+)', isAdmin, adminUser.getOneAdmin);
app.post('/api/admin/user/:userId(\\d+)/sendEmail', isAdmin, admin.sendUserEmail);
app.put('/api/admin/user/:userId(\\d+)/:accountId(\\d+)', isAdmin, admin.setUserAccount);
app.delete('/api/admin/user/:userId(\\d+)', isAdmin, admin.deleteUser);
app.delete('/api/admin/user/:userId(\\d+)/:accountId(\\d+)', isAdmin, admin.deleteUserAccount);
app.get('/api/admin/user/:accountId(\\d+)/lastConnect', isAdmin, admin.getUserPortLastConnect);
app.put('/api/admin/user/:userId(\\d+)/comment', isAdmin, isSuperAdmin, adminUser.editUserComment);

app.get('/api/admin/alipay', isAdmin, admin.getOrders);
app.get('/api/admin/alipay/csv', isAdmin, isSuperAdmin, admin.getCsvOrders);
app.get('/api/admin/alipay/recentOrder', isAdmin, admin.getRecentOrders);
app.get('/api/admin/alipay/:userId(\\d+)', isAdmin, admin.getUserOrders);
app.get('/api/admin/paypal', isAdmin, admin.getPaypalOrders);
app.get('/api/admin/paypal/csv', isAdmin, isSuperAdmin, admin.getPaypalCsvOrders);
app.get('/api/admin/paypal/recentOrder', isAdmin, admin.getPaypalRecentOrders);
app.get('/api/admin/paypal/:userId(\\d+)', isAdmin, admin.getPaypalUserOrders);

app.post('/api/admin/alipay/refund', isAdmin, isSuperAdmin, admin.alipayRefund);

app.get('/api/admin/refOrder', isAdmin, admin.getRefOrders);
app.get('/api/admin/refOrder/:userId(\\d+)', isAdmin, admin.getUserRefOrders);

app.get('/api/admin/notice', isAdmin, isSuperAdmin, adminNotice.getNotice);
app.get('/api/admin/notice/:noticeId(\\d+)', isAdmin, isSuperAdmin, adminNotice.getOneNotice);
app.post('/api/admin/notice', isAdmin, isSuperAdmin, adminNotice.addNotice);
app.put('/api/admin/notice/:noticeId(\\d+)', isAdmin, isSuperAdmin, adminNotice.editNotice);
app.delete('/api/admin/notice/:noticeId(\\d+)', isAdmin, isSuperAdmin, adminNotice.deleteNotice);

app.get('/api/admin/setting/payment', isAdmin, isSuperAdmin, adminSetting.getPayment);
app.put('/api/admin/setting/payment', isAdmin, isSuperAdmin, adminSetting.modifyPayment);
app.get('/api/admin/setting/account', isAdmin, adminSetting.getAccount);
app.put('/api/admin/setting/account', isAdmin, isSuperAdmin, adminSetting.modifyAccount);
app.get('/api/admin/setting/base', isAdmin, isSuperAdmin, adminSetting.getBase);
app.put('/api/admin/setting/base', isAdmin, isSuperAdmin, adminSetting.modifyBase);
app.get('/api/admin/setting/mail', isAdmin, isSuperAdmin, adminSetting.getMail);
app.put('/api/admin/setting/mail', isAdmin, isSuperAdmin, adminSetting.modifyMail);
app.get('/api/admin/setting/ref', isAdmin, adminSetting.getRef);
app.put('/api/admin/setting/ref', isAdmin, isSuperAdmin, adminSetting.modifyRef);
app.get('/api/admin/setting/ref/code', isAdmin, isSuperAdmin, adminSetting.getRefCode);
app.get('/api/admin/setting/ref/code/:id(\\d+)', isAdmin, isSuperAdmin, adminSetting.getOneRefCode);
app.put('/api/admin/setting/ref/code/:id(\\d+)', isAdmin, isSuperAdmin, adminSetting.editOneRefCode);
app.get('/api/admin/setting/ref/user', isAdmin, isSuperAdmin, adminSetting.getRefUser);
app.post('/api/admin/setting/ref/searchSourceUser', isAdmin, isSuperAdmin, adminSetting.searchSourceUser);
app.post('/api/admin/setting/ref/searchRefUser', isAdmin, isSuperAdmin, adminSetting.searchRefUser);
app.post('/api/admin/setting/ref/:sourceUserId(\\d+)/:refUserId(\\d+)/:code', isAdmin, isSuperAdmin, adminSetting.setRefForUser);
app.get('/api/admin/ref/code', isAdmin, user.getRefCode);
app.get('/api/admin/ref/user', isAdmin, user.getRefUser);
app.get('/api/admin/ref/user/:userId(\\d+)', isAdmin, admin.getRefUserById);
app.get('/api/admin/ref/code/:userId(\\d+)', isAdmin, admin.getRefCodeById);
app.post('/api/admin/ref/code/:userId(\\d+)', isAdmin, admin.addRefCodeForUser);
app.delete('/api/admin/ref/:sourceUserId(\\d+)/:refUserId(\\d+)', isAdmin, admin.deleteRefUser);
app.delete('/api/admin/ref/:code', isAdmin, isSuperAdmin, admin.deleteRefCode);


app.get('/api/admin/giftcard', isAdmin, adminGiftCard.getOrders);
app.get('/api/admin/giftcard/:userId(\\d+)', isAdmin, adminGiftCard.getUserOrders);
app.get('/api/admin/giftcard/list', isAdmin, adminGiftCard.listBatch);
app.get('/api/admin/giftcard/details/:batchNumber(\\d+)', isAdmin, adminGiftCard.getBatchDetails);
app.post('/api/admin/giftcard/revoke', isAdmin, adminGiftCard.revokeBatch);
app.post('/api/admin/giftcard/add', isAdmin, adminGiftCard.addGiftCard);
app.post('/api/admin/giftcard/use', isAdmin, isSuperAdmin, adminGiftCard.useGiftCardForUser);

app.get('/api/admin/group', isAdmin, adminGroup.getGroups);
app.get('/api/admin/group/:id(\\d+)', isAdmin, adminGroup.getOneGroup);
app.post('/api/admin/group', isAdmin, isSuperAdmin, adminGroup.addGroup);
app.put('/api/admin/group/:id(\\d+)', isAdmin, isSuperAdmin, adminGroup.editGroup);
app.delete('/api/admin/group/:id(\\d+)', isAdmin, isSuperAdmin, adminGroup.deleteGroup);
app.post('/api/admin/group/:groupId(\\d+)/:userId(\\d+)', isAdmin, isSuperAdmin, adminGroup.setUserGroup);

app.post('/api/admin/setting/changePassword', isAdmin, adminSetting.changePassword);

app.get('/api/admin/order', isAdmin, isSuperAdmin, adminOrder.getOrders);
app.get('/api/admin/order/:orderId(\\d+)', isAdmin, isSuperAdmin, adminOrder.getOneOrder);
app.post('/api/admin/order', isAdmin, isSuperAdmin, adminOrder.newOrder);
app.put('/api/admin/order/:orderId(\\d+)', isAdmin, isSuperAdmin, adminOrder.editOrder);
app.delete('/api/admin/order/:orderId(\\d+)', isAdmin, isSuperAdmin, adminOrder.deleteOrder);

app.get('/api/user/notice', isUser, user.getNotice);
app.get('/api/user/account', isUser, user.getAccount);
app.get('/api/user/usage', isUser, user.getAccountUsage);
app.get('/api/user/account/mac', isUser, user.getMacAccount);
app.post('/api/user/account/mac', isUser, user.addMacAccount);
app.get('/api/user/account/:accountId(\\d+)', isUser, user.getOneAccount);
app.put('/api/user/account/:accountId(\\d+)/active', isUser, user.activeAccount);
app.get('/api/user/account/:accountId(\\d+)/subscribe', isUser, user.getAccountSubscribe);
app.put('/api/user/account/:accountId(\\d+)/subscribe', isUser, user.updateAccountSubscribe);
app.get('/api/user/server', isUser, user.getServers);
app.get('/api/user/flow/:serverId(\\d+)/:accountId(\\d+)', isUser, user.getServerPortFlow);
app.get('/api/user/flow/:serverId(\\d+)/:accountId(\\d+)/lastConnect', isUser, user.getServerPortLastConnect);
app.put('/api/user/:accountId(\\d+)/password', isUser, user.changeShadowsocksPassword);
app.get('/api/user/multiServerFlow', isUser, user.getMultiServerFlowStatus);

app.get('/api/user/status/alipay', isUser, user.getAlipayStatus);

app.get('/api/user/order/price', isUser, user.getPrice);
app.post('/api/user/order/qrcode', isUser, user.createOrder);
app.post('/api/user/order/status', isUser, user.checkOrder);

app.post('/api/user/giftcard/use', isUser, user.payByGiftCard);

app.post('/api/user/paypal/create', isUser, user.createPaypalOrder);
app.post('/api/user/paypal/execute', isUser, user.executePaypalOrder);

app.post('/api/user/alipay/callback', user.alipayCallback);
app.post('/api/user/paypal/callback', user.paypalCallback);

app.post('/api/user/changePassword', isUser, user.changePassword);

app.get('/api/user/ref/code', isUser, user.getRefCode);
app.get('/api/user/ref/user', isUser, user.getRefUser);

app.get('/api/user/order', isUser, user.getOrder);

if (config.plugins.webgui_telegram && config.plugins.webgui_telegram.use) {
  const telegram = appRequire('plugins/webgui_telegram/account');
  app.get('/api/user/telegram/code', isUser, user.getTelegramCode);
  app.get('/api/admin/telegram/code', isAdmin, adminSetting.getTelegramCode);
  app.post('/api/user/telegram/unbind', isUser, user.unbindTelegram);
  app.post('/api/admin/telegram/unbind', isAdmin, adminSetting.unbindTelegram);
  app.get('/api/user/telegram/qrcode/:qrcodeId', telegram.qrcode);
  app.post('/api/user/telegram/login', telegram.login);
}

if (config.plugins.webgui.gcmAPIKey && config.plugins.webgui.gcmSenderId) {
  app.post('/api/push/client', push.client);
  app.delete('/api/push/client', push.deleteClient);
}

if (config.plugins.webgui_crisp && config.plugins.webgui_crisp.use) {
  const crisp = appRequire('plugins/webgui_crisp/index');
  app.get('/api/user/crisp', isUser, crisp.getUserToken);
  app.post('/api/user/crisp', isUser, crisp.setUserToken);
}

app.get('/favicon.png', (req, res) => {
  let file = './libs/favicon.png';
  let options = {
    root: './plugins/webgui/'
  };
  const iconPath = config.plugins.webgui.icon;
  if (iconPath) {
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
    if (!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value;
  }).then(success => {
    manifest.name = success.title;
    if(success.shortTitle) { manifest.short_name = success.shortTitle; }
    return res.json(manifest);
  });
});

const configForFrontend = {};

const cdn = config.plugins.webgui.cdn;
const keywords = config.plugins.webgui.keywords || ' ';
const description = config.plugins.webgui.description || ' ';
const analytics = config.plugins.webgui.googleAnalytics || 'UA-140334082-1';
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
  res.set({
    Link: [
      '</libs/style.css>; rel=preload; as=style,',
      '</libs/angular-material.min.css>; rel=preload; as=style,',
      '</libs/lib.js>; rel=preload; as=script,',
      '</libs/bundle.js>; rel=preload; as=script',
    ].join(' ')
  });
  return knex('webguiSetting').where({
    key: 'base',
  }).then(success => {
    if (!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value;
  }).then(success => {
    configForFrontend.themePrimary = success.themePrimary;
    configForFrontend.themeAccent = success.themeAccent;
    const filterColor = colors.filter(f => f.value === success.themePrimary);
    configForFrontend.browserColor = filterColor[0] ? filterColor[0].color : '#3F51B5';
    return res.render('index', {
      title: success.title,
      cdn,
      keywords,
      description,
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

app.get('/serviceworker.js', async (req, res) => {
  try {
    const setting = await knex('webguiSetting').select().where({
      key: 'base',
    }).then(success => {
      success[0].value = JSON.parse(success[0].value);
      return success[0].value;
    });
    res.header('Content-Type', 'text/javascript');
    res.render('serviceworker.js', {
      serviceWorker: !!setting.serviceWorker,
      serviceWorkerTime: setting.serviceWorkerTime,
    });
  } catch(err) {
    logger.error(err);
    res.status(500).end();
  }
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

