const log4js = require('log4js');
const logger = log4js.getLogger('webgui');

const config = appRequire('services/config').all();

const user = appRequire('plugins/user/index');
const account = appRequire('plugins/account/index');
const flow = appRequire('plugins/flowSaver/flow');
const knex = appRequire('init/knex').knex;
const emailPlugin = appRequire('plugins/email/index');
const groupPlugin = appRequire('plugins/group/index');
const push = appRequire('plugins/webgui/server/push');
const macAccount = appRequire('plugins/macAccount/index');
const ref = appRequire('plugins/webgui_ref/index');

const isTelegram = config.plugins.webgui_telegram && config.plugins.webgui_telegram.use;
let telegram;
if(isTelegram) {
  telegram = appRequire('plugins/webgui_telegram/admin');
}

const formatMacAddress = mac => {
  return mac.replace(/-/g, '').replace(/:/g, '').toLowerCase();
};

exports.signup = async (req, res) => {
  try {
    req.checkBody('email', 'Invalid email').isEmail();
    req.checkBody('code', 'Invalid code').notEmpty();
    req.checkBody('password', 'Invalid password').notEmpty();
    let type = 'normal';
    const validation = await req.getValidationResult();
    if(!validation.isEmpty()) {
      return Promise.reject('invalid body');
    }
    const email = req.body.email.toString().toLowerCase();
    const code = req.body.code;
    await emailPlugin.checkCode(email, code);
    await knex('user').count('id AS count').then(success => {
      if(!success[0].count) {
        type = 'admin';
      }
    });
    const password = req.body.password;
    let group = 0;
    const webguiSetting = await knex('webguiSetting').select().where({
      key: 'account',
    }).then(success => JSON.parse(success[0].value));
    if(webguiSetting.defaultGroup) {
      try {
        await groupPlugin.getOneGroup(webguiSetting.defaultGroup);
        group = webguiSetting.defaultGroup;
      } catch(err) {}
    }
    const [ userId ] = await user.add({
      username: email,
      email,
      password,
      type,
      group,
    });
    req.session.user = userId;
    req.session.type = type;
    if(req.body.ref) { ref.addRefUser(req.body.ref, req.session.user); }
    if(userId === 1) { return; }
    const newUserAccount = webguiSetting.accountForNewUser;
    if(newUserAccount) {
      const getNewPort = async () => {
        return knex('webguiSetting').select().where({
          key: 'account',
        }).then(success => {
          if(!success.length) { return Promise.reject('settings not found'); }
          success[0].value = JSON.parse(success[0].value);
          return success[0].value.port;
        }).then(port => {
          if(port.random) {
            const getRandomPort = () => Math.floor(Math.random() * (port.end - port.start + 1) + port.start);
            let retry = 0;
            let myPort = getRandomPort();
            const checkIfPortExists = port => {
              let myPort = port;
              return knex('account_plugin').select()
              .where({ port }).then(success => {
                if(success.length && retry <= 30) {
                  retry++;
                  myPort = getRandomPort();
                  return checkIfPortExists(myPort);
                } else if (success.length && retry > 30) {
                  return Promise.reject('Can not get a random port');
                } else {
                  return myPort;
                }
              });
            };
            return checkIfPortExists(myPort);
          } else {
            return knex('account_plugin').select()
            .whereBetween('port', [port.start, port.end])
            .orderBy('port', 'ASC').then(success => {
              const portArray = success.map(m => m.port);
              let myPort;
              for(let p = port.start; p <= port.end; p++) {
                if(portArray.indexOf(p) < 0) {
                  myPort = p; break;
                }
              }
              if(myPort) {
                return myPort;
              } else {
                return Promise.reject('no port');
              }
            });
          }
        });
      };
      const port = await getNewPort();
      await account.addAccount(newUserAccount.type || 5, {
        user: userId,
        orderId: 0,
        port,
        password: Math.random().toString().substr(2,10),
        time: Date.now(),
        limit: newUserAccount.limit || 8,
        flow: (newUserAccount.flow ? newUserAccount.flow : 350) * 1000000,
        server: newUserAccount.server ? JSON.stringify(newUserAccount.server): null,
        autoRemove: newUserAccount.autoRemove ? 1 : 0,
        multiServerFlow: newUserAccount.multiServerFlow ? 1 : 0,
      });
    }
    logger.info(`[${ req.body.email }] signup success`);
    push.pushMessage('注册', {
      body: `用户[ ${ req.body.email.toString().toLowerCase() } ]注册成功`,
    });
    isTelegram && telegram.push(`用户[ ${ req.body.email.toString().toLowerCase() } ]注册成功`);
    res.send(type);
  } catch(err) {
    logger.error(`[${ req.body.email }] signup fail: ${ err }`);
    const errorData = ['user exists'];
    if(errorData.indexOf(err) < 0) {
      return res.status(403).end();
    } else {
      return res.status(403).end(err);
    }
  }
};

exports.login = async (req, res) => {
  try {
    delete req.session.user;
    delete req.session.type;
    req.checkBody('email', 'Invalid email').isEmail();
    req.checkBody('password', 'Invalid password').notEmpty();
    const validation = await req.getValidationResult();
    if(!validation.isEmpty()) {
      return Promise.reject('invalid body');
    }
    const email = req.body.email.toString().toLowerCase();
    const password = req.body.password;
    const result = await user.checkPassword(email, password);
    logger.info(`[${ req.body.email }] login success`);
    req.session.user = result.id;
    req.session.type = result.type;
    res.send({
      type: result.type,
      id: result.id,
    });
  } catch(err) {
    logger.error(`User[${ req.body.email }] login fail: ${ err }`);
    const errorData = [
      'invalid body',
      'user not exists',
      'invalid password',
      'password retry out of limit'
    ];
    if(errorData.indexOf(err) < 0) {
      return res.status(500).end();
    } else {
      return res.status(403).end(err);
    }
  }
};

exports.macLogin = (req, res) => {
  delete req.session.user;
  delete req.session.type;
  const mac = formatMacAddress(req.body.mac);
  const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
  macAccount.login(mac, ip)
  .then(success => {
    req.session.user = success.userId;
    req.session.type = 'normal';
    return res.send('success');
  }).catch(err => {
    return res.status(403).end();
  });
};

exports.logout = (req, res) => {
  delete req.session.user;
  delete req.session.type;
  res.send('success');
};

exports.status = async (req, res) => {
  const colors = [
    { value: 'red', color: '#F44336' },
    { value: 'pink', color: '#E91E63' },
    { value: 'purple', color: '#9C27B0' },
    { value: 'deep-purple', color: '#673AB7' },
    { value: 'indigo', color: '#3F51B5' },
    { value: 'blue', color: '#2196F3' },
    { value: 'light-blue', color: '#03A9F4' },
    { value: 'cyan', color: '#00BCD4' },
    { value: 'teal', color: '#009688' },
    { value: 'green', color: '#4CAF50' },
    { value: 'light-green', color: '#8BC34A' },
    { value: 'lime', color: '#CDDC39' },
    { value: 'yellow', color: '#FFEB3B' },
    { value: 'amber', color: '#FFC107' },
    { value: 'orange', color: '#FF9800' },
    { value: 'deep-orange', color: '#FF5722' },
    { value: 'brown', color: '#795548' },
    { value: 'blue-grey', color: '#607D8B' },
    { value: 'grey', color: '#9E9E9E' },
  ];
  try {
    const base = (await knex('webguiSetting').select().where({
      key: 'base',
    }).then(success => {
      success[0].value = JSON.parse(success[0].value);
      return success[0].value;
    }));
    const themePrimary = base.themePrimary;
    const themeAccent = base.themeAccent;
    const filterColor = colors.filter(f => f.value === base.themePrimary);
    const browserColor = filterColor[0] ? filterColor[0].color : '#3F51B5';

    const status = req.session.type; // admin/normal/undefined
    const id = req.session.user;
    const version = appRequire('package').version;
    const site = config.plugins.webgui.site;
    const skin = config.plugins.webgui.skin || 'default';
    let alipay;
    let paypal;
    let paypalMode;
    let telegram;
    let giftcard;
    let refCode;
    let email;
    let subscribe;
    let multiAccount;
    if(status) {
      email = (await knex('user').select(['email']).where({ id }).then(s => s[0])).email;
      alipay = config.plugins.alipay && config.plugins.alipay.use;
      paypal = config.plugins.paypal && config.plugins.paypal.use;
      paypalMode = config.plugins.paypal && config.plugins.paypal.mode;
      telegram = config.plugins.webgui_telegram && config.plugins.webgui_telegram.use;
      giftcard = config.plugins.giftcard && config.plugins.giftcard.use;
      refCode = (await knex('webguiSetting').select().where({
        key: 'webgui_ref',
      }).then(success => {
        success[0].value = JSON.parse(success[0].value);
        return success[0].value;
      })).useRef;
      subscribe = (await knex('webguiSetting').select().where({
        key: 'account',
      }).then(success => {
        success[0].value = JSON.parse(success[0].value);
        return success[0].value;
      })).subscribe;
    }
    if(status === 'normal') {
      knex('user').update({ lastLogin: Date.now() }).where({ id }).then();
      const groupId = (await knex('user').select(['group']).where({ id }).then(s => s[0])).group;
      multiAccount = (await knex('group').where({ id: groupId }).then(s => s[0])).multiAccount;
    }
    res.send({
      status,
      id,
      email,
      version,
      themePrimary,
      themeAccent,
      browserColor,
      site,
      skin,
      alipay,
      paypal,
      paypalMode,
      telegram,
      giftcard,
      refCode,
      subscribe,
      multiAccount,
    });
  } catch(err) {
    console.log(err);
    delete req.session.user;
    delete req.session.type;
    return res.status(403).end();
  }
};

exports.sendCode = (req, res) => {
  const refCode = req.body.refCode;
  req.checkBody('email', 'Invalid email').isEmail();
  req.getValidationResult().then(result => {
    if(result.isEmpty) { return; }
    return Promise.reject('invalid email');
  }).then(() => {
    return knex('webguiSetting').select().where({
      key: 'account',
    })
    .then(success => JSON.parse(success[0].value))
    .then(success => {
      if(success.signUp.isEnable) { return; }
      if(refCode) {
        return ref.checkRefCodeForSignup(refCode).then(success => {
          if(success) { return; }
          return Promise.reject('invalid ref code');
        });
      }
      return Promise.reject('signup close');
    });
  }).then(() => {
    return knex('webguiSetting').select().where({
      key: 'mail',
    }).then(success => {
      if(!success.length) {
        return Promise.reject('settings not found');
      }
      success[0].value = JSON.parse(success[0].value);
      return success[0].value.code;
    });
  }).then(success =>{
    const email = req.body.email.toString().toLowerCase();
    const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
    const session = req.sessionID;
    return emailPlugin.sendCode(email, success.title || 'ss验证码', success.content || '欢迎新用户注册，\n您的验证码是：', {
      ip,
      session,
    });
  }).then(success => {
    res.send('success');
  }).catch(err => {
    logger.error(err);
    const errorData = ['email in black list', 'send email out of limit', 'signup close', 'invalid ref code'];
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
  let resetEmail;
  knex('webguiSetting').select().where({
    key: 'mail',
  }).then(success => {
    if(!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value.reset;
  }).then(success => {
    resetEmail = success;
    return knex('user').select().where({
      username: email,
    }).then(users => {
      if(!users.length) {
        return Promise.reject('user not exists');
      }
      return users[0];
    });
  }).then(user => {
    if(user.resetPasswordTime + 600 * 1000 >= Date.now()) {
      return Promise.reject('already send');
    }
    token = crypto.randomBytes(16).toString('hex');
    const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
    const session = req.sessionID;
    const address = config.plugins.webgui.site + '/home/password/reset/' + token;
    if(resetEmail.content.indexOf('${address}') >= 0) {
      resetEmail.content = resetEmail.content.replace(/\$\{address\}/g, address);
    } else {
      resetEmail.content += '\n' + address;
    }
    return emailPlugin.sendMail(email, resetEmail.title, resetEmail.content, {
      ip,
      session,
      type: 'reset',
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

exports.visitRef = (req, res) => {
  const code = req.params.refCode;
  ref.visitRefCode(code).then(success => {
    res.send({ valid: success });
  }).catch(err => {
    logger.error(err);
    res.status(403).end();
  });
};