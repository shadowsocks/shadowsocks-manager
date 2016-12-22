'use strict';

const app = appRequire('plugins/webgui/index').app;
const user = appRequire('plugins/webgui/server/user');
const admin = appRequire('plugins/webgui/server/admin');

const isUser = () => {};
const isAdmin = () => {};

app.get('/api/login', user.status);
app.post('/api/email/code');
app.post('/api/signup', user.signup);
app.post('/api/login', user.login);
app.post('/api/logout', user.logout);

app.get('*', (req, res) => {
  return res.render('index');
});
