var nodemailer = require('nodemailer');
var log4js = require('log4js');
var moment = require('moment');
var logger = log4js.getLogger('auth');

var mongoose = require('mongoose');
var Mail = mongoose.model('Mail');

var config = require('../../config').conf;

var crypto = require('crypto');
var md5 = (text) => crypto.createHash('md5').update(text).digest('hex');

var transporter = nodemailer.createTransport('smtps://' + config.mail.address.split('@')[0] +'%40' + config.mail.address.split('@')[1] + ':' + config.mail.password + '@' + config.mail.smtp);

var mongoose = require('mongoose');
var User = mongoose.model('User');

var sendActiveMail = function() {
    Mail.findOneAndUpdate({
        type: 1,
        send: false
    }, {
        $set: {
            send: true,
            sendTime: Date.now()
        }
    }).exec((err, mail) => {
        if(err || !mail) {return;}
        User.findOneAndUpdate({
            email: mail.email,
            isAdmin: false
        }, {
            $set: {
                'activeKey': md5(mail.email + new Date()),
                'sendEmailTime': Date.now()
            }
        }, {new: true}).exec(function(err, user) {
            if(err || !user) {return;}
            transporter.sendMail({
                from: '"Shadowsocks" <'+ config.mail.address +'>',
                to: user.email,
                subject: 'Shadowsocks激活邮件',
                text: '您好，请点击下列链接激活您的账户：\n\n' + config.mail.webaddress + '/home/active/' + user.activeKey + '\n\n该链接60分钟内有效'
            }, function(error, info){
                if(error){
                    logger.warn('[' + user.activeKey + '][' + user.email + ']激活码发送失败\n' + error);
                    return;
                }
                logger.info('[' + user.activeKey + '][' + user.email + ']激活码发送成功');
            });
        });
    });
};
exports.sendActiveMail = sendActiveMail;

var sendResetPasswordMail = () => {
    Mail.findOneAndUpdate({
        type: 2,
        send: false
    }, {
        $set: {
            send: true,
            sendTime: Date.now()
        }
    }).exec((err, mail) => {
        if(err || !mail) {return;}
        User.findOneAndUpdate({
            email: mail.email,
            isAdmin: false
        }, {
            $set: {
                'resetPasswordKey': md5(mail.email + Date.now()),
                'sendResetKeyTime': Date.now()
            }
        }, {new: true}).exec((err, user) => {
            if(err || !user) {return;}
            transporter.sendMail({
                from: '"Shadowsocks" <'+ config.mail.address +'>',
                to: user.email,
                subject: 'Shadowsocks密码重置',
                text: '您好，请点击下列链接重置您的密码：\n\n' + config.mail.webaddress + '/home/resetPassword/' + user.resetPasswordKey + '\n\n该链接15分钟内有效'
            }, function(error, info){
                if(error){
                    logger.warn('[' + user.resetPasswordKey + '][' + user.email + ']重置密码邮件发送失败\n' + error);
                    return;
                }
                logger.info('[' + user.resetPasswordKey + '][' + user.email + ']重置密码邮件发送成功');
            });
        });
    });
};
exports.sendResetPasswordMail = sendResetPasswordMail;

exports.addMail = function(userName, type) {

    if(userName.match(new RegExp('@bccto.me'), 'i')) {return;}
    if(userName.match(new RegExp('@mail.bccto.me'), 'i')) {return;}
    if(userName.match(new RegExp('@chacuo.net'), 'i')) {return;}
    if(userName.match(new RegExp('@dispostable.com'), 'i')) {return;}
    if(userName.match(new RegExp('@trbvn.com'), 'i')) {return;}
    if(userName.match(new RegExp('@leeching.net'), 'i')) {return;}
    if(userName.match(new RegExp('@top1post.ru'), 'i')) {return;}
    if(userName.match(new RegExp('@hmamail.com'), 'i')) {return;}
    if(userName.match(new RegExp('@yopmail.com'), 'i')) {return;}
    if(userName.match(new RegExp('@mvrht.com'), 'i')) {return;}
    if(userName.match(new RegExp('@ruu.kr'), 'i')) {return;}

    if(type === 1) {
        Mail.findOne({email: userName, type: 1, send: false}).exec((err, email) =>  {
            if(err || email) {return;}
            Mail.findOne({
                email: userName,
                type: 1,
                send: true,
                sendTime: {
                    $gte: moment().add(-5, 'minute').toDate()
                }
            }).exec((err, email) => {
                if(err || email) {return;}
                var mail = new Mail();
                mail.email = userName;
                mail.type = 1;
                mail.send = false;
                mail.save((err, data) => {
                    if(data) {logger.info('用户[' + userName + ']的激活邮件加入待发送列表');}
                    sendActiveMail();
                });
            });
        });
    }
    if(type === 2) {
        Mail.findOne({email: userName, type: 2, send: false}).exec((err, email) =>  {
            if(err || email) {return;}
            Mail.findOne({
                email: userName,
                type: 2,
                send: true,
                sendTime: {
                    $gte: moment().add(-5, 'minute').toDate()
                }
            }).exec((err, email) => {
                if(err || email) {return;}
                var mail = new Mail();
                mail.email = userName;
                mail.type = 2;
                mail.send = false;
                mail.save((err, data) => {
                    if(data) {logger.info('用户[' + userName + ']的重置密码邮件加入待发送列表');}
                    sendResetPasswordMail();
                });
            });
        });
    }
};