'use strict';

const app = appRequire('plugins/webgui/index').app;
const user = appRequire('plugins/webgui/server/user');
const admin = appRequire('plugins/webgui/server/admin');

const isUser = () => {};
const isAdmin = (req, res, next) => {
  if(req.session.type === 'admin') {
    return next();
  } else {
    return res.status(401).end();
  }
};

app.get('/api/login', user.status);
app.post('/api/email/code');
app.post('/api/signup', user.signup);
app.post('/api/login', user.login);
app.post('/api/logout', user.logout);

app.get('/api/admin/server', isAdmin, admin.getServers);
app.get('/api/admin/server/:serverId', isAdmin, admin.getOneServer);
app.post('/api/admin/server', isAdmin, admin.addServer);

app.get('/api/admin/account', isAdmin, admin.getAccount);
app.post('/api/admin/account', isAdmin, admin.addAccount);
app.put('/api/admin/account/:accountId/port', isAdmin, admin.changeAccountPort);
app.put('/api/admin/account/:accountId/data', isAdmin, admin.changeAccountData);
app.delete('/api/admin/account/:accountId', isAdmin, admin.deleteAccount);

// app.get('/test', (req, res) => {
//   return res.render('index0');
// });

// const flow = appRequire('plugins/flowSaver/flow');
// flow.getServerFlow(2, [Date.now() - 900 * 1000, Date.now() - 600 * 1000, Date.now() - 300 * 1000, Date.now()]).then(console.log).catch(console.log);

app.get('*', (req, res) => {
  return res.render('index');
});
