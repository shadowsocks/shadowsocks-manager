'use strict';

const app = appRequire('plugins/freeAccount/index').app;
const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const email = appRequire('plugins/email/index');
const path = require('path');

const randomAccount = async (email, flow) => {
  const port = 56342;
  const password = '12345';
  try {
    await manager.send({
      command: 'add',
      port,
      password,
    });
    const address = 'abcdefg';
    await knex('freeAccount').insert({
      address, email, port, flow, time: Date.now(), expired: Date.now() + 5 * 60 * 1000, isDisabled: false,
    });
    return;
  } catch(err) {
    console.log(err);
    return Promise.reject(err);
  }
};

app.post('/email', (req, res) => {
  req.checkBody('email', 'Email address error').notEmpty().isEmail();
  var errors = req.validationErrors();
  if (errors) {
    return res.send(errors, 400);
  }
  const emailAddress = req.body.email;
  email.sendCode(emailAddress, 'Hello', 'Your code is:')
  .then(s => res.send('success'), e => res.status(403).end());
});

app.post('/code', (req, res) => {
  const emailAddress = req.body.email;
  const code = req.body.code;
  email.checkCode(emailAddress, code)
  .then(success => {
    return randomAccount(emailAddress, 100000);
  }).then(success => {
    res.send('success');
  }).catch(error => {
    res.status(403).end();
  });
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
