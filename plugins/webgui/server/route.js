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

// app.get('/test', (req, res) => {
//   return res.render('index0');
// });

app.get('*', (req, res) => {
  return res.render('index');
});
