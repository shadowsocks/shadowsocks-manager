'use strict';

const app = appRequire('plugins/webgui/index').app;
const home = appRequire('plugins/webgui/server/home');
const user = appRequire('plugins/webgui/server/user');
const admin = appRequire('plugins/webgui/server/admin');

const isUser = (req, res, next) => {
  if (req.session.type === 'normal') {
    return next();
  } else {
    return res.status(401).end();
  }
};
const isAdmin = (req, res, next) => {
  if (req.session.type === 'admin') {
    return next();
  } else {
    return res.status(401).end();
  }
};

app.get('/api/home/login', user.status);
app.post('/api/home/code', home.sendCode);
app.post('/api/home/signup', user.signup);
app.post('/api/home/login', user.login);
app.post('/api/home/logout', user.logout);

app.get('/api/admin/server', isAdmin, admin.getServers);
app.get('/api/admin/server/:serverId', isAdmin, admin.getOneServer);
app.post('/api/admin/server', isAdmin, admin.addServer);
app.put('/api/admin/server/:serverId', isAdmin, admin.editServer);
app.delete('/api/admin/server/:serverId', isAdmin, admin.deleteServer);

app.get('/api/admin/account', isAdmin, admin.getAccount);
app.get('/api/admin/account/:accountId', isAdmin, admin.getOneAccount);
app.post('/api/admin/account', isAdmin, admin.addAccount);
app.put('/api/admin/account/:accountId/port', isAdmin, admin.changeAccountPort);
app.put('/api/admin/account/:accountId/data', isAdmin, admin.changeAccountData);
app.delete('/api/admin/account/:accountId', isAdmin, admin.deleteAccount);

app.get('/api/admin/flow/:serverId', isAdmin, admin.getServerFlow);
app.get('/api/admin/flow/:serverId/:port', isAdmin, admin.getServerPortFlow);
app.get('/api/admin/flow/:serverId/:port/lastConnect', isAdmin, admin.getServerPortLastConnect);

app.get('/api/admin/user', isAdmin, admin.getUsers);
app.get('/api/admin/user/account', isAdmin, admin.getUserAccount);
app.get('/api/admin/user/:userId', isAdmin, admin.getOneUser);
app.put('/api/admin/user/:userId/:accountId', isAdmin, admin.setUserAccount);
app.delete('/api/admin/user/:userId/:accountId', isAdmin, admin.deleteUserAccount);

app.get('/api/user/account', isUser, user.getAccount);
app.get('/api/user/server', isUser, user.getServers);
app.get('/api/user/flow/:serverId/:port', isUser, user.getServerPortFlow);
app.get('/api/user/flow/:serverId/:port/lastConnect', isUser, user.getServerPortLastConnect);

app.get('*', (req, res) => {
  return res.render('index');
});