const log4js = require('log4js');
const logger = log4js.getLogger('webgui');

const config = appRequire('services/config').all();

const user = appRequire('plugins/user/index');
const account = appRequire('plugins/account/index');
const flow = appRequire('plugins/flowSaver/flow');
const knex = appRequire('init/knex').knex;
const emailPlugin = appRequire('plugins/email/index');
const push = appRequire('plugins/webgui/server/push');

exports.signup = (req, res) => {
  req.checkBody('email', 'Invalid email').isEmail();
  req.checkBody('code', 'Invalid code').notEmpty();
  req.checkBody('password', 'Invalid password').notEmpty();
  let type = 'normal';
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const email = req.body.email.toString().toLowerCase();
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
    const email = req.body.email.toString().toLowerCase();
    const password = req.body.password;
    return user.add({
      username: email,
      email,
      password,
      type,
    });
  }).then(success => {
    if(success[0] > 1) {
      const userId = success[0];
      let port = 50000;
      return knex('webguiSetting').select().where({
        key: 'system',
      })
      .then(success => JSON.parse(success[0].value))
      .then(success => {
        const newUserAccount = success.accountForNewUser;
        if(!success.accountForNewUser.isEnable) {
          return;
        }
        return knex('account_plugin').select().orderBy('port', 'DESC').limit(1)
        .then(success => {
          if(success.length) {
            port = success[0].port + 1;
          }
          return account.addAccount(newUserAccount.type || 5, {
            user: userId,
            port,
            password: Math.random().toString().substr(2,10),
            time: Date.now(),
            limit: newUserAccount.limit || 8,
            flow: (newUserAccount.flow ? newUserAccount.flow : 350) * 1000000,
            autoRemove: 1,
          });
        });
      });
    } else {
      return;
    }
  }).then(success => {
    logger.info(`[${ req.body.email }] signup success`);
    push.pushMessage('注册', {
      body: `用户[ ${ req.body.email.toString().toLowerCase() } ]注册成功`,
    });
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
      const email = req.body.email.toString().toLowerCase();
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
    const errorData = ['invalid body', 'user not exists', 'invalid password', 'password retry out of limit'];
    if(errorData.indexOf(err) < 0) {
      return res.status(500).end();
    } else {
      return res.status(403).end(err);
    }
  });
};

exports.logout = (req, res) => {
  delete req.session.user;
  delete req.session.type;
  res.send('success');
};

exports.status = (req, res) => {
  res.send({ status: req.session.type });
};

exports.sendCode = (req, res) => {
  req.checkBody('email', 'Invalid email').isEmail();
  req.getValidationResult().then(result => {
    if(result.isEmpty) { return; }
    return Promise.reject('invalid email');
  }).then(() => {
    return knex('webguiSetting').select().where({
      key: 'system',
    })
    .then(success => JSON.parse(success[0].value))
    .then(success => {
      if(success.signUp.isEnable) { return; }
      return Promise.reject('signup close');
    });
  }).then(() => {
    const email = req.body.email.toString().toLowerCase();
    const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
    const session = req.sessionID;
    return emailPlugin.sendCode(email, 'ss验证码', '欢迎新用户注册，\n您的验证码是：', {
      ip,
      session,
    });
  }).then(success => {
    res.send('success');
  }).catch(err => {
    logger.error(err);
    const errorData = ['email in black list', 'send email out of limit', 'signup close'];
    if(errorData.indexOf(err) < 0) {
      return res.status(403).end();
    } else {
      return res.status(403).end(err);
    }
  });
};

exports.sendResetPasswordEmail = (req, res) => {
  const crypto = require('crypto');
  const email = req.body.email.toString().toLowerCase();
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
    const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
    const session = req.sessionID;
    const address = config.plugins.webgui.site + '/home/password/reset/' + token;
    return emailPlugin.sendMail(email, 'ss密码重置', '请访问下列地址重置您的密码：\n' + address, {
      ip,
      session,
    });
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
  req.checkBody('token', 'Invalid token').notEmpty();
  req.checkBody('password', 'Invalid password').notEmpty();
  req.getValidationResult().then(result => {
    if(result.isEmpty) { return; }
    return Promise.reject('invalid body');
  }).then(() => {
    const token = req.body.token;
    const password = req.body.password;
    return user.edit({
      resetPasswordId: token,
    }, {
      password,
      resetPasswordId: null,
      resetPasswordTime: null,
    });
  }).then(success => {
    res.send('success');
  }).catch(err => {
    logger.error(err);
    res.status(403).end();
  });
};
