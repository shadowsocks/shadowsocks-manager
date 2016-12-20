'use strict';

const app = appRequire('plugins/webgui/index').app;

app.post('/api/email/code');
app.post('/api/user/signup');
app.post('/api/user/login');
app.post('/api/user/logout');

app.get('*', (req, res) => {
  return res.render('index');
});
