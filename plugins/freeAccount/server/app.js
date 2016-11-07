'use strict';

const app = appRequire('plugins/freeAccount/index').app;
const email = appRequire('plugins/email/index');
const path = require('path');

app.post('/email', (req, res) => {
  req.checkBody('email', 'Email address error').notEmpty().isEmail();
  var errors = req.validationErrors();
  if (errors) {
    return res.send(errors, 400);
  }
  const emailAddress = req.body.email;
  email.sendCode(emailAddress, 'Hello', 'Your code is:').then(s => res.send(s), e => res.send(e));
});
app.post('/code', (req, res) => {
  const emailAddress = req.body.email;
  const code = req.body.code;
  email.checkCode(emailAddress, code).then(s => res.send(s), e => res.send(e));
});

app.get('/', (req, res) => {
  return res.render('email', {
    'controllers': [
      '/public/controllers/email.js',
    ],
    'routes': [
      '/public/routes/email.js'
    ]
  });
});
