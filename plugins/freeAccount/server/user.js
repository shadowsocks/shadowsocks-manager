'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('freeAccount');

const config = appRequire('services/config').all();
const app = appRequire('plugins/freeAccount/index').app;
const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const email = appRequire('plugins/email/index');
const account = appRequire('plugins/freeAccount/server/account');

const sendEmail = (req, res) => {
  req.checkBody('email', 'Email address error').notEmpty().isEmail();
  var errors = req.validationErrors();
  if (errors) {
    return res.send(errors, 400);
  }
  const emailAddress = req.body.email;
  const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
  const session = req.sessionID;
  email.sendCode(emailAddress, 'Free Shadowsocks 验证码', '您的验证码是:', {
    ip,
    session,
  })
  .then(() => {
    return res.send('success');
  }).catch(error => {
    logger.error('Send email: ' + error);
    return res.status(403).end();
  });
};

const checkCode = (req, res) => {
  const emailAddress = req.body.email;
  const code = req.body.code;
  email.checkCode(emailAddress, code)
  .then(success => {
    return account.createAccount(emailAddress);
  }).then(success => {
    res.send(success);
  }).catch(error => {
    logger.error('Check code: ' + error);
    if(error && error.toString().startsWith('out of limit, ')) {
      return res.status(403).send(error.toString());
    }
    res.status(403).end();
  });
};

const getAccount = (req, res) => {
  const address = req.body.address;
  let accountInfo;
  knex('freeAccount').select().where({address})
  .then(success => {
    if(success.length > 0) {
      accountInfo = success[0];
      return manager.send({command: 'list'});
    } else {
      res.status(403).end();
    }
  }).then(success => {
    const port = success.filter(f => {
      return f.port === accountInfo.port;
    })[0];
    if(!port) {
      res.status(403).end();
    } else {
      accountInfo.host = config.plugins.freeAccount.host;
      accountInfo.password = port.password;
      accountInfo.method = config.plugins.freeAccount.shadowsocks.method;
      res.send(accountInfo);
    }
  }).catch(error => {
    logger.error('Get account:');
    logger.error(error);
    res.status(403).end();
  });
};

const render = (req, res) => {
  return res.render('index');
};

exports.render = render;
exports.sendEmail = sendEmail;
exports.checkCode = checkCode;
exports.getAccount = getAccount;
