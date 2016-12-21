'use strict';

const user = appRequire('plugins/user/index');

exports.signup = (req, res) => {
  req.checkBody('email', 'Invalid email').isEmail();
  req.checkBody('password', 'Invalid password').notEmpty();
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const email = req.body.email;
      const password = req.body.password;
      return user.add({
        username: email,
        email,
        password,
        type: 1,
      });
    }
    result.throw();
  }).then(success => {
    req.send(success);
  }).catch(err => {
    console.log(err.array());
    res.send(err);
  });
};

exports.login = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  user.checkPassword(email, password).then(() => {
    res.send('success');
  }).catch(() => {
    res.send('fail');
  });
};
