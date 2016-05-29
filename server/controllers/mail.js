var nodemailer = require('nodemailer');

var config = require('../../config').conf;

var transporter = nodemailer.createTransport('smtps://igyteng%40gmail.com:gytgoo112358@smtp.gmail.com');

var mailOptions = {
    from: '"Shadowsocks-Manager" <igyteng@gmail.com>',
    to: '"78089220@qq.com", 78089220@qq.com',
    subject: 'Hello',
    text: 'Hello world',
    html: '<b>Hello world</b>'
};

var mongoose = require('mongoose');
var User = mongoose.model('User');

exports.sendActiveMail = function() {
    if(sendMailQueue.length === 0) {return;}
    userName = sendMailQueue[0];
    sendMailQueue.splice(0, 1);
    User.findOneAndUpdate({email: userName}, {
        $set: {
            'sendEmailTime': new Date()
        }
    }, {new: true}).exec(function(err, data) {
        if(err || !data) {return;}
        transporter.sendMail({
            from: '"Shadowsocks" <igyteng@gmail.com>',
            to: '"' + data.email + '", ' + data.email,
            subject: 'Shadowsocks激活邮件',
            text: '您好，请点击下列链接激活您的账户：http://gyteng.com:6003/#/home/active/' + data.activeKey
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