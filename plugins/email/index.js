'use strict';

const log4js = require('log4js');
const logger = log4js.getLogger('email');

const nodemailer = require('nodemailer');
const config = appRequire('services/config').all();
const knex = appRequire('init/knex').knex;

const smtpConfig = {
  host: config.plugins.email.host,
  port: 465,
  secure: true,
  auth: {
    user: config.plugins.email.username,
    pass: config.plugins.email.password,
  }
};

const transporter = nodemailer.createTransport(smtpConfig);

const sendMail = async (to, subject, text) => {
  transporter.sendMail({
    from: config.plugins.email.username,
    to,
    subject,
    text,
  }, (error, info) => {
    if(error) {
      return Promise.reject(error);
    }
    return info;
  });
};

const sendCode = async (to, subject = 'subject', text) => {
  const sendEmailTime = 10;
  try {
    const findEmail = await knex('email').select(['remark']).where({
      to,
      type: 'code',
    }).whereBetween('time', [Date.now() - sendEmailTime * 60 * 1000, Date.now()]);
    if(findEmail.length > 0) {
      return findEmail[0].remark;
    }
    const code = Math.random().toString().substr(2, 6);
    text += '\n' + code;
    await sendMail(to, subject, text);
    await knex('email').insert({
      to,
      subject,
      text,
      type: 'code',
      remark: code,
      time: Date.now(),
    });
    logger.info(`[${ to }] Send code: ${ code }`);
    return code;
  } catch (err) {
    logger.error(`Send code fail: ${ err }`);
    return Promise.reject(err);
  }
};

const checkCode = async (email, code) => {
  logger.info(`[${ email }] Check code: ${ code }`);
  const sendEmailTime = 10;
  try {
    const findEmail = await knex('email').select(['remark']).where({
      to: email,
      remark: code,
      type: 'code',
    }).whereBetween('time', [Date.now() - sendEmailTime * 60 * 1000, Date.now()]);
    if(findEmail.length === 0) {
      throw new Error('Email or code not found');
    }
  } catch(err) {
    logger.error(`Check code fail: ${ err }`);
    return Promise.reject(err);
  }
};

exports.checkCode = checkCode;
exports.sendCode = sendCode;
exports.sendMail = sendMail;
