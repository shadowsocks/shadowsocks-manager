var nodemailer = require('nodemailer');

var config = require('../../config').conf;

var crypto = require('crypto');
var md5 = function(text) {
        return crypto.createHash('md5').update(text).digest('hex');
};

var transporter = nodemailer.createTransport('smtps://' + config.mail.address.split('@')[0] +'%40' + config.mail.address.split('@')[1] + ': ' + config.mail.password + '@' + config.mail.smtp);

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
            text: '您好，请点击下列链接激活您的账户：' + config.mail.webaddress + '/#/home/active/' + data.activeKey + '，该链接15分钟内有效'
        }, function(error, info){
            if(error){
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);
        });
    });
};

var sendMailQueue = [];

exports.addMail = function(userName) {
    if(sendMailQueue.indexOf(userName) < 0) {
        sendMailQueue.push(userName);
    }
};