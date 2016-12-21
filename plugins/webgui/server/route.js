'use strict';

const app = appRequire('plugins/webgui/index').app;
const user = appRequire('plugins/webgui/server/user');
const admin = appRequire('plugins/webgui/server/admin');

app.post('/api/email/code');
app.post('/api/user/signup', user.signup);
app.post('/api/user/login', user.login);
app.post('/api/user/logout');

app.get('*', (req, res) => {
  return res.render('index');
});
