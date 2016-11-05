'use strict';

const app = appRequire('plugins/freeAccount/index').app;
const email = appRequire('plugins/email/index');

app.post('/email', (req, res) => {
  const emailAddress = req.body.email;
  email.sendCode(emailAddress, 'Hello', 'Your code is:').then(s => res.send(s), e => res.send(e));
});
app.post('/code', (req, res) => {

});

app.get('/', (req, res) => {
  return res.render('email');
});
