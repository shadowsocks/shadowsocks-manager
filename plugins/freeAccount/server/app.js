'use strict';

const crypto = require('crypto');
const config = appRequire('services/config').all();
const app = appRequire('plugins/freeAccount/index').app;
const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const email = appRequire('plugins/email/index');
const path = require('path');
const flow = appRequire('plugins/flowSaver/flow');

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomAccount = async (email, flow) => {
  const min = config.plugins.freeAccount.startPort;
  const max = config.plugins.freeAccount.endPort;
  const port = getRandomInt(min, max);
  const password = crypto.randomBytes(6).toString('hex');
  try {
    await manager.send({
      command: 'add',
      port,
      password,
    });
    const address = crypto.randomBytes(16).toString('hex');
    await knex('freeAccount').insert({
      address,
      email,
      port,
      flow: config.plugins.freeAccount.flow * 1000 * 1000,
      currentFlow: 0,
      time: Date.now(),
      expired: Date.now() + config.plugins.freeAccount.time * 60 * 1000,
      isDisabled: false,
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

app.post('/account', (req, res) => {
  const address = req.body.address;
  knex('freeAccount').select().where({address}).then(success => {
    if(success.length > 0) {
      res.send(success[0]);
    } else {
      res.status(403).end();
    }
  }).catch(err => {
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
