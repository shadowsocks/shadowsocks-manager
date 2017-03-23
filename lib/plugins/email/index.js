function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const log4js = require('log4js');
const logger = log4js.getLogger('email');

const nodemailer = require('nodemailer');
const config = appRequire('services/config').all();
const knex = appRequire('init/knex').knex;
const isInBlackList = appRequire('plugins/email/blackList').isInBlackList;

const smtpConfig = {
  host: config.plugins.email.host,
  port: config.plugins.email.port || 465,
  secure: true,
  auth: {
    user: config.plugins.email.username,
    pass: config.plugins.email.password
  }
};

const transporter = nodemailer.createTransport(smtpConfig);

const sendMail = (() => {
  var _ref = _asyncToGenerator(function* (to, subject, text, options = {}) {
    if (isInBlackList(to)) {
      logger.error('Email in black list: ' + to);
      return Promise.reject('email in black list');
    }
    const send = function (to, subject, text) {
      return new Promise(function (resolve, reject) {
        transporter.sendMail({
          from: `"${config.plugins.email.name || ''}" <${config.plugins.email.email || config.plugins.email.username}>`,
          to,
          subject,
          text
        }, function (error, info) {
          if (error) {
            return reject(error);
          }
          return resolve(info);
        });
      });
    };
    const checkLimit = (() => {
      var _ref2 = _asyncToGenerator(function* (ip, session) {
        let ipNumber = yield knex('email').where({ ip }).whereBetween('time', [Date.now() - 3600 * 1000, Date.now()]).count('time as count').then(function (success) {
          return success[0].count;
        });
        let sessionNumber = yield knex('email').where({ session }).whereBetween('time', [Date.now() - 3600 * 1000, Date.now()]).count('time as count').then(function (success) {
          return success[0].count;
        });
        if (ip === '127.0.0.1' || !ip) {
          ipNumber = 0;
        }
        if (!session) {
          sessionNumber = 0;
        }
        return ipNumber + sessionNumber;
      });

      return function checkLimit(_x4, _x5) {
        return _ref2.apply(this, arguments);
      };
    })();
    const number = yield checkLimit(options.ip, options.session);
    if (number >= 40) {
      return Promise.reject('send email out of limit');
    }
    yield send(to, subject, text);
    yield knex('email').insert({
      to,
      subject,
      text,
      type: options.type,
      remark: options.remark,
      ip: options.ip,
      session: options.session,
      time: Date.now()
    });
    return;
  });

  return function sendMail(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
})();

const sendCode = (() => {
  var _ref3 = _asyncToGenerator(function* (to, subject = 'subject', text, options = {}) {
    const sendEmailTime = 10;
    try {
      const findEmail = yield knex('email').select(['remark']).where({
        to,
        type: 'code'
      }).whereBetween('time', [Date.now() - sendEmailTime * 60 * 1000, Date.now()]);
      if (findEmail.length > 0) {
        return findEmail[0].remark;
      }
      const code = Math.random().toString().substr(2, 6);
      text += '\n' + code;
      yield sendMail(to, subject, text, {
        type: 'code',
        remark: code,
        ip: options.ip,
        session: options.session
      });
      logger.info(`[${to}] Send code: ${code}`);
      return code;
    } catch (err) {
      logger.error(`Send code fail: ${err}`);
      return Promise.reject(err);
    }
  });

  return function sendCode(_x6) {
    return _ref3.apply(this, arguments);
  };
})();

const checkCode = (() => {
  var _ref4 = _asyncToGenerator(function* (email, code) {
    logger.info(`[${email}] Check code: ${code}`);
    const sendEmailTime = 10;
    try {
      const findEmail = yield knex('email').select(['remark']).where({
        to: email,
        remark: code,
        type: 'code'
      }).whereBetween('time', [Date.now() - sendEmailTime * 60 * 1000, Date.now()]);
      if (findEmail.length === 0) {
        throw new Error('Email or code not found');
      }
    } catch (err) {
      logger.error(`Check code fail: ${err}`);
      return Promise.reject(err);
    }
  });

  return function checkCode(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
})();

exports.checkCode = checkCode;
exports.sendCode = sendCode;
exports.sendMail = sendMail;