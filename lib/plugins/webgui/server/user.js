'use strict';

const user = appRequire('plugins/user/index');
const knex = appRequire('init/knex').knex;

exports.signup = (req, res) => {
  req.checkBody('email', 'Invalid email').isEmail();
  req.checkBody('password', 'Invalid password').notEmpty();
  let type = 'normal';
  req.getValidationResult().then(result => {
    if (result.isEmpty()) {
      return knex('user').count('id AS count').then(success => {
        if (!success[0].count) {
          type = 'admin';
        }
        return;
      });
    }
    result.throw();
  }).then(success => {
    const email = req.body.email;
    const password = req.body.password;
    return user.add({
      username: email,
      email,
      password,
      type
    });
  }).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.login = (req, res) => {
  delete req.session.user;
  delete req.session.type;
  req.checkBody('email', 'Invalid email').isEmail();
  req.checkBody('password', 'Invalid password').notEmpty();
  req.getValidationResult().then(result => {
    if (result.isEmpty()) {
      const email = req.body.email;
      const password = req.body.password;
      return user.checkPassword(email, password);
    }
    result.throw();
  }).then(success => {
    req.session.user = success.id;
    req.session.type = success.type;
    res.send({ type: success.type });
  }).catch(err => {
    console.log(err);
    res.status(401).end();
  });
};

exports.logout = (req, res) => {
  delete req.session.user;
  delete req.session.type;
  res.send('success');
};