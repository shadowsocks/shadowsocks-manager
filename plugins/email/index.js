const nodemailer = require('nodemailer');
const config = appRequire('services/config').all();

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

// sendMail({
//   from: config.plugins.email.username,
//   to: 'gyttyg2@qq.com',
//   subject: 'Hello',
//   html: '<b>Hello world</b>'
// }).then(console.log);
