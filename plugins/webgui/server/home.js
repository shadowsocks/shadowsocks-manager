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
    result.throw();
  }).then(success => {
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
    if(result.isEmpty()) {
      const email = req.body.email;
      const password = req.body.password;
      return user.checkPassword(email, password);
    }
    result.throw();
  }).then(success => {
    logger.info(`用户[${ req.body.email }]登录成功`);
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

exports.status = (req, res) => {
  res.send({status: req.session.type });
};

exports.sendCode = (req, res) => {
  const email = req.body.email;
  emailPlugin.sendCode(email, '验证码', '您的验证码是：').then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(500).end();
  });
};
