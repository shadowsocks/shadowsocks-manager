var nodemailer = require('nodemailer');
var log4js = require('log4js');
var logger = log4js.getLogger('auth');

var config = require('../../config').conf;

var crypto = require('crypto');
var md5 = function(text) {
        return crypto.createHash('md5').update(text).digest('hex');
};

var transporter = nodemailer.createTransport('smtps://' + config.mail.address.split('@')[0] +'%40' + config.mail.address.split('@')[1] + ': ' + config.mail.password + '@' + config.mail.smtp);

// var transporter = nodemailer.createTransport({ 
//     host: 'smtp.' + config.mail.address.split('@')[1], 
//     port: 465, 
//     auth: { user: config.mail.address, pass: config.mail.password },
//     secure: true
// });

var mongoose = require('mongoose');
var User = mongoose.model('User');

exports.sendActiveMail = function() {
    if(sendMailQueue.length === 0) {return;}
    userName = sendMailQueue[0];
    sendMailQueue.splice(0, 1);
    User.findOneAndUpdate({email: userName}, {
        $set: {
            'activeKey': md5('userName' + new Date()),
            'sendEmailTime': new Date()
        }
    }, {new: true}).exec(function(err, data) {
        if(err || !data) {return;}
        transporter.sendMail({
            from: '"Shadowsocks" <'+ config.mail.address +'>',
            to: data.email,
            subject: 'Shadowsocks激活邮件',
            text: '您好，请点击下列链接激活您的账户：\n\n' + config.mail.webaddress + '/home/active/' + data.activeKey + '\n\n该链接15分钟内有效'
        }, function(error, info){
            if(error){
                logger.warn('[' + data.activeKey + '][' + data.email + ']激活码发送失败\n' + error);
                return;
            }
            logger.info('[' + data.activeKey + '][' + data.email + ']激活码发送成功');
        });
    });
};

var sendMailQueue = [];

exports.addMail = function(userName) {
    if(sendMailQueue.indexOf(userName) < 0) {
        sendMailQueue.push(userName);
    }
};