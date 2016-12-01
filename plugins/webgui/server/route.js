'use strict';

const app = appRequire('plugins/webgui/index').app;

app.get('*', (req, res) => {
  return res.render('index');
});
