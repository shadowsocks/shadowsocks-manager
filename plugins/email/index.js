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

const sendMail = async (options) => {
  transporter.sendMail(options, (error, info) => {
    if(error) {
      return Promise.reject(error);
    }
    return info;
  });
};

const sendCode = async (to) => {
  const code = Math.random().toString().substr(2, 6);
  await transporter.sendMail({
    from: config.plugins.email.username,
      to,
      subject: 'Hello',
      text: 'Your code is [' + code + ']',
  });
  await knex('email').insert({
    to,
    subject: 'Hello',
    text: 'Your code is [' + code + ']',
    type: 'code',
    remark: code,
    time: Date.now(),
  });
  return;
};

// sendCode('igyteng@gmail.com').then(console.log);
// sendMail({
//   from: config.plugins.email.username,
//   to: 'gyttyg2@qq.com',
//   subject: 'Hello',
//   text: '<b>Hello world</b>'
// }).then(console.log);
