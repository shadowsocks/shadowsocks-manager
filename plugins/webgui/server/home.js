const log4js = require('log4js');
const logger = log4js.getLogger('webgui');

const user = appRequire('plugins/user/index');
const account = appRequire('plugins/account/index');
const flow = appRequire('plugins/flowSaver/flow');
const knex = appRequire('init/knex').knex;
const emailPlugin = appRequire('plugins/email/index');

exports.signup = (req, res) => {
  req.checkBody('email', 'Invalid email').isEmail();
  req.checkBody('code', 'Invalid code').notEmpty();
  req.checkBody('password', 'Invalid password').notEmpty();
  let type = 'normal';
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const email = req.body.email;
      const code = req.body.code;
      return emailPlugin.checkCode(email, code);
    }
    return Promise.reject('invalid body');
  }).then(success => {
    // The first user will be admin
    return knex('user').count('id AS count').then(success => {
      if(!success[0].count) {
        type = 'admin';
      }
      return;
    });
  }).then(success => {
    const email = req.body.email;
    const password = req.body.password;
    return user.add({
      username: email,
      email,
      password,
      type,
    });
  }).then(success => {
    logger.info(`[${ req.body.email }] signup success`);
    res.send('success');
  }).catch(err => {
    logger.error(`[${ req.body.email }] signup fail: ${ err }`);
    res.status(403).end();
  });
};

exports.login = (req, res) => {
  delete req.session.user;
  delete req.session.type;
  req.checkBody('email', 'Invalid email').isEmail();
  req.checkBody('password', 'Invalid password').notEmpty();
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const email = req.body.email;
      const password = req.body.password;
      return user.checkPassword(email, password);
    }
    return Promise.reject('invalid body');
  }).then(success => {
    logger.info(`[${ req.body.email }] login success`);
    req.session.user = success.id;
    req.session.type = success.type;
    res.send({ type: success.type });
  }).catch(err => {
    logger.error(`User[${ req.body.email }] login fail: ${ err }`);
    const errorData = ['invalid body', 'user not exists', 'invalid password'];
    if(errorData.indexOf(err) < 0) {
      return res.status(500).end();
    } else {
      return res.status(403).end();
    }
  });
};

exports.logout = (req, res) => {
  delete req.session.user;
  delete req.session.type;
  res.send('success');
};

exports.status = (req, res) => {
  res.send({status: req.session.type });
};

exports.sendCode = (req, res) => {
  req.checkBody('email', 'Invalid email').isEmail();
  req.getValidationResult().then(result => {
    if(result.isEmpty) { return; }
    return Promise.reject('invalid email');
  }).then(() => {
    const email = req.body.email;
    return emailPlugin.sendCode(email, '验证码', '您的验证码是：');
  }).then(success => {
    res.send('success');
  }).catch(err => {
    logger.error(err);
    res.status(403).end();
  });
};

exports.sendResetPasswordEmail = (req, res) => {
  const crypto = require('crypto');
  const email = req.body.email;
  let token = null;
  knex('user').select().where({
    username: email,
  }).then(users => {
    if(!users.length) {
      return Promise.reject('user not exists');
    }
    return users[0];
  }).then(user => {
    if(user.resetPasswordTime + 600 * 1000 >= Date.now()) {
      return Promise.reject('already send');
    }
    token = crypto.randomBytes(16).toString('hex');
    return emailPlugin.sendMail(email, 'Shadowsocks密码重置', 'http://127.0.0.1:8080/home/password/reset/' + token);
  }).then(success => {
    return user.edit({
      username: email,
    }, {
      resetPasswordId: token,
      resetPasswordTime: Date.now(),
    });
  }).then(success => {
    res.send('success');
  }).catch(err => {
    logger.error(err);
    const errorData = ['already send', 'user not exists'];
    if(errorData.indexOf(err) < 0) {
      return res.status(403).end();
    } else {
      return res.status(403).end(err);
    }
  });
};

exports.checkResetPasswordToken = (req, res) => {
  const token = req.query.token;
  knex('user').select().where({
    resetPasswordId: token,
  }).whereBetween('resetPasswordTime', [ Date.now() - 600 * 1000, Date.now() ])
  .then(users => {
    if(!users.length) {
      return Promise.reject('user not exists');
    }
    return users[0];
  }).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.resetPassword = (req, res) => {
  const token = req.body.token;
  const password = req.body.password;
  user.edit({
    resetPasswordId: token,
  }, {
    password,
    resetPasswordId: null,
    resetPasswordTime: null,
  }).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};
