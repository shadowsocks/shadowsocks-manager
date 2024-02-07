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
const axios = require('axios');
const TwitterLogin = appRequire('plugins/webgui/server/twitterLogin');
const redis = appRequire('init/redis').redis;

const { body, validationResult } = require('express-validator');

const isTelegram = config.plugins.webgui_telegram && config.plugins.webgui_telegram.use;
let telegram;
if(isTelegram) {
  telegram = appRequire('plugins/webgui_telegram/admin');
}

const formatMacAddress = mac => {
  return mac.replace(/-/g, '').replace(/:/g, '').toLowerCase();
};

const getRandomPassword = passowrdLength => {
  const passwordChars = '23456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  const password = Array(passowrdLength).fill(passwordChars).map(function(x) { return x[Math.floor(Math.random() * x.length)]; }).join('');
  return password;
};

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

const createUser = async (email, password, from = '') => {
  let type = 'normal';
  await knex('user').count('id AS count').then(success => {
    if(!success[0].count) {
      type = 'admin';
    }
  });
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
  if(userId === 1) {
    return {
      id: userId,
      type: 'admin',
    };
  }
  const newUserAccount = webguiSetting.accountForNewUser;
  if(newUserAccount.isEnable) {
    const port = await getNewPort();
    if(newUserAccount.fromOrder) {
      const orderInfo = await knex('webgui_order').where({ id: newUserAccount.type }).then(s => s[0]);
      if(orderInfo) {
        await account.addAccount(orderInfo.type || 5, {
          user: userId,
          orderId: orderInfo.id,
          port,
          password: getRandomPassword(10),
          time: Date.now(),
          limit: orderInfo.cycle,
          flow: orderInfo.flow,
          server: orderInfo.server,
          autoRemove: orderInfo.autoRemove ? 1 : 0,
          multiServerFlow: orderInfo.multiServerFlow ? 1 : 0,
        });
      }
    } else {
      await account.addAccount(newUserAccount.type || 5, {
        user: userId,
        orderId: 0,
        port,
        password: getRandomPassword(10),
        time: Date.now(),
        limit: newUserAccount.limit || 8,
        flow: (newUserAccount.flow ? newUserAccount.flow : 350) * 1000000,
        server: newUserAccount.server ? JSON.stringify(newUserAccount.server): null,
        autoRemove: newUserAccount.autoRemove ? 1 : 0,
        multiServerFlow: newUserAccount.multiServerFlow ? 1 : 0,
      });
    }
  }
  logger.info(`[${ email }] signup success`);
  push.pushMessage('注册', {
    body: `${ from }用户[ ${ email.toString().toLowerCase() } ]注册成功`,
  });
  isTelegram && telegram.push(`${ from }用户[ ${ email.toString().toLowerCase() } ]注册成功`);
  return {
    id: userId,
    type: 'normal',
  };
};

exports.signup = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email: rawEmail, code, password, ref } = req.body;
    const email = rawEmail.toString().toLowerCase();

    // Check the code validity
    await emailPlugin.checkCode(email, code);

    // Determine the user type
    let type = 'normal';
    const userCount = await knex('user').count('id as count').first();
    if (userCount.count === 0) {
      type = 'admin';
    }

    // Determine the default group
    let group = 0;
    const webguiSetting = await knex('webguiSetting').where({ key: 'account' }).first().then(row => JSON.parse(row.value));
    if (webguiSetting.defaultGroup) {
      try {
        await groupPlugin.getOneGroup(webguiSetting.defaultGroup);
        group = webguiSetting.defaultGroup;
      } catch (err) {
        // Log or handle the error if necessary
      }
    }

    // Add the user
    const [userId] = await user.add({ username: email, email, password, type, group });

    // Set session
    req.session.user = userId;
    req.session.type = type;

    // Handle referral, if applicable
    if (ref) {
      await ref.addRefUser(ref, userId);
    }

    // Handle new user account creation, if enabled
    if (webguiSetting.accountForNewUser && webguiSetting.accountForNewUser.isEnable) {
      // Your logic for handling new user accounts goes here
    }

    logger.info(`[${email}] signup success`);
    // Additional logic for success response
    res.send({ type, userId });

  } catch (err) {
    logger.error(`[${req.body.email}] signup fail: ${err}`);
    res.status(403).send({ error: err.message || 'An error occurred during signup.' });
  }
};


exports.login = async (req, res) => {
  try {
    delete req.session.user;
    delete req.session.type;

    body('email', 'Invalid email').isEmail();
    body('password', 'Invalid password').notEmpty();

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
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

exports.googleLogin = async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;
    const {
      google_login_client_id: client_id,
      google_login_client_secret: client_secret
    } =  config.plugins.webgui;
    if(!code || !client_id) {
      return await Promise.reject();
    }
    const { data: result } = await axios({
      url: 'https://www.googleapis.com/oauth2/v4/token',
      method: 'POST',
      data: {
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: 'authorization_code',
      },
    });
    if(!result.access_token) { return await Promise.reject(); }
    const { data: userInfo } = await axios({
      url: 'https://www.googleapis.com/oauth2/v1/userinfo',
      method: 'GET',
      params: {
        alt: 'json',
      },
      headers: {
        Authorization: `Bearer ${ result.access_token }`,
      },
    });
    if(userInfo.verified_email && userInfo.email) {
      const email = userInfo.email;
      const user = await knex('user').where({ username: email }).then(s => s[0]);
      if(user) {
        req.session.user = user.id;
        req.session.type = user.type;
        logger.info(`Google用户[${email}]登录`);
        return res.send({ id: user.id, type: user.type });
      } else {
        const password = Math.random().toString();
        const user = await createUser(email, password, 'Google');
        req.session.user = user.id;
        req.session.type = user.type;
        return res.send({ id: user.id, type: user.type });
      }
    }
    return await Promise.reject();
  } catch(err) {
    logger.error(err);
    return res.status(403).end();
  }
};

let facebookAppToken = '';
const getFacebookAppToken = async () => {
  if(facebookAppToken) { return facebookAppToken; }
  const {
    facebook_login_client_id: client_id,
    facebook_login_client_secret: client_secret,
  } = config.plugins.webgui;
  const { data: result } = await axios({
    url: 'https://graph.facebook.com/oauth/access_token',
    headers: {
      Accept: 'application/json',
    },
    params: {
      client_id,
      client_secret,
      grant_type: 'client_credentials',
    },
  });
  if(!result.access_token) { return Promise.reject(); }
  facebookAppToken = result.access_token;
  return result.access_token;
};

exports.facebookLogin = async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;
    const {
      facebook_login_client_id: client_id,
      facebook_login_client_secret: client_secret,
    } = config.plugins.webgui;
    if(!code || !client_id) {
      return Promise.reject();
    }
    const { data: result } = await axios({
      url: 'https://graph.facebook.com/v3.3/oauth/access_token',
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      params: {
        code,
        client_id,
        client_secret,
        redirect_uri,
      },
    });
    if(!result.access_token) { return Promise.reject(); }
    const { data: checkToken } = await axios({
      url: 'https://graph.facebook.com/debug_token',
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      params: {
        input_token: result.access_token,
        access_token: await getFacebookAppToken(),
      },
    });
    if(!checkToken.data || checkToken.data.app_id !== client_id || !checkToken.data.is_valid) {
      return Promise.reject();
    }
    const { data: userInfo } = await axios({
      url: 'https://graph.facebook.com/me',
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      params: {
        fields: 'email',
        access_token: result.access_token,
      },
    });
    if(userInfo.email) {
      const email = userInfo.email;
      const user = await knex('user').where({ username: email }).then(s => s[0]);
      if(user) {
        req.session.user = user.id;
        req.session.type = user.type;
        logger.info(`Facebook用户[${email}]登录`);
        return res.send({ id: user.id, type: user.type });
      } else {
        const password = Math.random().toString();
        const user = await createUser(email, password, 'Facebook');
        req.session.user = user.id;
        req.session.type = user.type;
        return res.send({ id: user.id, type: user.type });
      }
    }
    return Promise.reject();
  } catch(err) {
    logger.error(err);
    return res.status(403).end();
  }
};

exports.githubLogin = async (req, res) => {
  try {
    const { code, redirect_uri, state } = req.body;
    const {
      github_login_client_id: client_id,
      github_login_client_secret: client_secret,
    } = config.plugins.webgui;
    if(!code || !client_id) {
      return await Promise.reject();
    }
    const { data: result } = await axios({
      url: 'https://github.com/login/oauth/access_token',
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      data: {
        code,
        client_id,
        client_secret,
        redirect_uri,
        state,
      },
    });
    if(!result.access_token) { return await Promise.reject(); }
    const { data: userInfo } = await axios({
      url: 'https://api.github.com/user',
      method: 'GET',
      headers: {
        'User-Agent': 'ssmgr',
        Authorization: `token ${ result.access_token }`,
      },
    });
    const { data: emails } = await axios({
      url: 'https://api.github.com/user/emails',
      method: 'GET',
      headers: {
        'User-Agent': 'ssmgr',
        Authorization: `token ${ result.access_token }`,
      },
    });
    const emailInfo = emails.filter(f => f.primary === true)[0];
    if(emailInfo.email && emailInfo.verified) {
      const email = emailInfo.email;
      const user = await knex('user').where({ username: email }).then(s => s[0]);
      if(user) {
        req.session.user = user.id;
        req.session.type = user.type;
        logger.info(`Github用户[${email}]登录`);
        return res.send({ id: user.id, type: user.type });
      } else {
        const password = Math.random().toString();
        const user = await createUser(email, password, 'Github');
        req.session.user = user.id;
        req.session.type = user.type;
        return res.send({ id: user.id, type: user.type });
      }
    }
    return await Promise.reject();
  } catch(err) {
    logger.error(err);
    return res.status(403).end();
  }
};

exports.getTwitterLoginUrl = async (req, res) => {
  try {
    const { callbackUrl } = req.query;
    const time = callbackUrl.split('?time=')[1];
    const {
      twitter_login_consumer_key: consumerKey,
      twitter_login_consumer_secret: consumerSecret
    } =  config.plugins.webgui;
    if(!callbackUrl || !time || !consumerKey || !consumerSecret) {
      throw('invalid params');
    }
    if(Math.abs(Date.now() - (+time)) >= 10 * 60 * 1000) {
      throw('invalid time');
    }
    const tl = new TwitterLogin({
      consumerKey,
      consumerSecret,
      callbackUrl,
    });
    const { tokenSecret, url } = await tl.login();
    await redis.set(`TwitterLogin:${time}`, tokenSecret, 'EX', 120);
    res.send(url);
  } catch(err) {
    logger.error(err);
    return res.status(403).end();
  }
};

exports.twitterLogin = async (req, res) => {
  try {
    const { oauth_token, oauth_verifier, callbackUrl } = req.body;
    const time = callbackUrl.split('?time=')[1];
    if(Math.abs(Date.now() - (+time)) >= 10 * 60 * 1000) {
      throw('invalid time');
    }
    const {
      twitter_login_consumer_key: consumerKey,
      twitter_login_consumer_secret: consumerSecret
    } =  config.plugins.webgui;
    const tl = new TwitterLogin({
      consumerKey,
      consumerSecret,
      callbackUrl,
    });
    const tokenSecret = await redis.get(`TwitterLogin:${time}`);
    const { userToken, userTokenSecret } = await tl.callback({ oauth_token, oauth_verifier }, tokenSecret);
    const userInfo = await tl.userInfo({ userToken, userTokenSecret });
    
    const email = userInfo.email;
    const user = await knex('user').where({ username: email }).then(s => s[0]);
    if(user) {
      req.session.user = user.id;
      req.session.type = user.type;
      logger.info(`Twitter用户[${email}]登录`);
      return res.send({ id: user.id, type: user.type });
    } else {
      const password = Math.random().toString();
      const user = await createUser(email, password, 'Twitter');
      req.session.user = user.id;
      req.session.type = user.type;
      return res.send({ id: user.id, type: user.type });
    }
  } catch(err) {
    logger.error(err);
    return res.status(403).end();
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
    const base = await knex('webguiSetting').select().where({
      key: 'base',
    }).then(success => JSON.parse(success[0].value));
    const account = await knex('webguiSetting').select().where({
      key: 'account',
    }).then(success => JSON.parse(success[0].value));
    const themePrimary = base.themePrimary;
    const themeAccent = base.themeAccent;
    const filterColor = colors.filter(f => f.value === base.themePrimary);
    const browserColor = filterColor[0] ? filterColor[0].color : '#3F51B5';

    const status = req.session.type; // admin/normal/undefined
    const id = req.session.user;
    const version = appRequire('package').version;
    const site = config.plugins.webgui.site;
    const skin = config.plugins.webgui.skin || 'default';
    const language = config.plugins.webgui.language || '';
    const google_login_client_id = config.plugins.webgui.google_login_client_id || '';
    const facebook_login_client_id = config.plugins.webgui.facebook_login_client_id || '';
    const github_login_client_id = config.plugins.webgui.github_login_client_id || '';
    const twitter_login_client_id = !!config.plugins.webgui.twitter_login_consumer_key;
    const crisp = (config.plugins.webgui_crisp && config.plugins.webgui_crisp.use) ? config.plugins.webgui_crisp.websiteId : '';
    let alipay;
    let paypal;
    let paypalMode;
    let telegram;
    let giftcard;
    let refCode;
    let email;
    let subscribe;
    let multiAccount;
    let simple;
    let macAccount;
    let showAllServer;
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
      simple = (await knex('webguiSetting').select().where({
        key: 'account',
      }).then(success => {
        success[0].value = JSON.parse(success[0].value);
        return success[0].value;
      })).simple;
      macAccount = (await knex('webguiSetting').select().where({
        key: 'account',
      }).then(success => {
        success[0].value = JSON.parse(success[0].value);
        return success[0].value;
      })).macAccount;
    }
    if(status === 'normal') {
      knex('user').update({ lastLogin: Date.now() }).where({ id }).then();
      const groupId = (await knex('user').select(['group']).where({ id }).then(s => s[0])).group;
      multiAccount = (await knex('group').where({ id: groupId }).then(s => s[0])).multiAccount;
      showAllServer = account.showAllServer;
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
      language,
      alipay,
      paypal,
      paypalMode,
      telegram,
      giftcard,
      refCode,
      subscribe,
      multiAccount,
      simple,
      macAccount,
      google_login_client_id,
      facebook_login_client_id,
      github_login_client_id,
      twitter_login_client_id,
      crisp,
      showAllServer,
    });
  } catch(err) {
    logger.error(err);
    delete req.session.user;
    delete req.session.type;
    return res.status(403).end();
  }
};

exports.sendCode = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const refCode = req.body.refCode;
    const email = req.body.email.toString().toLowerCase();
    const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
    const session = req.sessionID;

    // Retrieve settings to check if signUp is enabled and to get mail settings
    const accountSettingRow = await knex('webguiSetting').where({ key: 'account' }).first();
    if (!accountSettingRow) throw new Error('Account settings not found');
    
    const accountSettings = JSON.parse(accountSettingRow.value);
    if (!accountSettings.signUp.isEnable) throw new Error('Signup is closed');

    if (refCode) {
      const refCodeValid = await ref.checkRefCodeForSignup(refCode);
      if (!refCodeValid) throw new Error('Invalid ref code');
    }

    const mailSettingRow = await knex('webguiSetting').where({ key: 'mail' }).first();
    if (!mailSettingRow) throw new Error('Mail settings not found');
    
    const mailSettings = JSON.parse(mailSettingRow.value).code;
    await emailPlugin.sendCode(email, mailSettings.title || 'ss验证码', mailSettings.content || '欢迎新用户注册，\n您的验证码是：', { ip, session });

    res.send('success');
  } catch (err) {
    logger.error(err);
    const errorData = ['email in black list', 'send email out of limit', 'signup close', 'invalid ref code', 'Account settings not found', 'Mail settings not found'];
    const statusCode = errorData.includes(err.message) ? 403 : 500;
    res.status(statusCode).send(err.message || 'An error occurred');
  }
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

exports.resetPassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract the token and password from the request body
    const { token, password } = req.body;

    // Attempt to update the user's password
    await user.edit({
      resetPasswordId: token,
    }, {
      password,
      resetPasswordId: null,
      resetPasswordTime: null,
    });

    // If successful, send a success response
    res.send('success');
  } catch (err) {
    // Log the error and send an appropriate response
    logger.error(err);
    res.status(403).send(err.message || 'An error occurred');
  }
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
