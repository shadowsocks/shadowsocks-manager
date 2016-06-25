var nodemailer = require('nodemailer');
var log4js = require('log4js');
var moment = require('moment');
var logger = log4js.getLogger('auth');

var mongoose = require('mongoose');
var Mail = mongoose.model('Mail');

var config = require('../../config').conf;

var crypto = require('crypto');
var md5 = (text) => crypto.createHash('md5').update(text).digest('hex');

var transporter = nodemailer.createTransport('smtps://' + config.mail.address.split('@')[0] +'%40' + config.mail.address.split('@')[1] + ': ' + config.mail.password + '@' + config.mail.smtp);

var mongoose = require('mongoose');
var User = mongoose.model('User');

var sendActiveMail = function() {
    // if(sendMailQueue.length === 0) {return;}
    // userName = sendMailQueue[0];
    // sendMailQueue.splice(0, 1);
    // var userName;
    // User.findOneAndUpdate({}, {
    //     $set: {
    //         'activeKey': md5('userName' + new Date()),
    //         'sendEmailTime': new Date()
    //     }
    // }, {new: true}).exec(function(err, data) {
    //     if(err || !data) {return;}
    //     userName = data.email;
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
        User.findOneAndUpdate({email: mail.email}, {
            $set: {
                'activeKey': md5(mail.email + new Date()),
                'sendEmailTime': Date.now()
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
    });
};
exports.sendActiveMail = sendActiveMail;

// var sendMailQueue = [];

exports.addMail = function(userName, type) {
    if(userName.match(new RegExp('@mail.bccto.me'), 'i')) {return;}
    if(userName.match(new RegExp('@chacuo.net'), 'i')) {return;}
    if(userName.match(new RegExp('@dispostable.com'), 'i')) {return;}
    if(userName.match(new RegExp('@trbvn.com'), 'i')) {return;}
    if(userName.match(new RegExp('@leeching.net'), 'i')) {return;}
    if(userName.match(new RegExp('@top1post.ru'), 'i')) {return;}
    if(userName.match(new RegExp('@hmamail.com'), 'i')) {return;}
    // if(sendMailQueue.indexOf(userName) < 0) {
    //     sendMailQueue.push(userName);
    // }
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
};