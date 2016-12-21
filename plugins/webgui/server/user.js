'use strict';

const user = appRequire('plugins/user/index');

exports.signup = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  user.add({
    username: email,
    email,
    password,
    type: 1,
  }).then(success => {
    req.send(success);
  }).catch(err => {
    res.send(err);
  });
};
