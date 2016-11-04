'use strict';

const app = appRequire('plugins/freeAccount/index').app;

app.post('/email', (req, res) => {});
app.post('/code', (req, res) => {});

app.get('/', (req, res) => {
  return res.render('email');
});
