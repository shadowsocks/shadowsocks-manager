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

var transporter = nodemailer.createTransport(smtpConfig);

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
    await transporter.sendMail({
      from: config.plugins.email.username,
        to,
        subject,
        text,
    });
    await knex('email').insert({
      to,
      subject,
      text,
      type: 'code',
      remark: code,
      time: Date.now(),
    });
    return code;
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};

const checkCode = async (email, code) => {
  const sendEmailTime = 10;
  try {
    const findEmail = await knex('email').select(['remark']).where({
      to: email,
      remark: code,
      type: 'code',
    }).whereBetween('time', [Date.now() - sendEmailTime * 60 * 1000, Date.now()]);
    if(findEmail.length === 0) {
      return Promise.reject();
    }
  } catch(err) {
    console.log(err);
    return Promise.reject(err);
  }
};

exports.checkCode = checkCode;
exports.sendCode = sendCode;
exports.sendMail = sendMail;
// checkCode('igyteng@gmail.com', '505740').then();
// sendCode('igyteng@gmail.com').then(console.log);
// sendMail({
//   from: config.plugins.email.username,
//   to: 'gyttyg2@qq.com',
//   subject: 'Hello',
//   text: '<b>Hello world</b>'
// }).then(console.log);
