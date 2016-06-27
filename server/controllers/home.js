var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var log4js = require('log4js');
var logger = log4js.getLogger('auth');

var version = require('../../package.json').version;

var User = mongoose.model('User');
var mail = require('./mail');
var freeAccount = require('./freeAccount');

var moment = require('moment');
var crypto = require('crypto');
var md5 = (text) => crypto.createHash('md5').update(text).digest('hex');

var createPassword = (password, username) => md5(password + username);


exports.signup = function(req, res) {
    var email = req.body.username;
    var password = req.body.password;
    var fingerprint = req.body.fingerprint;
    if(!email || !password) {return res.status(400).end('请求数据不合法');}
    if(password.length < 6) {return res.status(400).end('密码长度太短');}
    User.findOne({email: email}).exec(function(err, data) {
        if(err) {return res.status(500).end('数据库操作错误：' + err);}
        else if(data) {return res.status(403).end('该用户已注册');}
        var user = new User();
        user.email = email;
        user.password = createPassword(password, email);
        user.signupIp = req.connection.remoteAddress;
        user.signupFp = fingerprint;
        user.save(function(err, data) {
            if(err) {return res.status(500).end('数据库操作错误：' + err);}
            mail.addMail(email, 1);
            logger.info('[' + email + ']注册成功');
            return res.send('success');
        });
    });
};

exports.login = function(req, res) {
    var email = req.body.username;
    var password = req.body.password;

    User.findOne({email: email}).exec(function(err, user) {
        if(err) {
            req.session.destroy();
            return res.status(500).end('数据库操作错误：' + err);
        }
        else if(!user) { return res.status(401).end('用户未注册');}
        var passwordWithMd5 = createPassword(password, user.email);
        if(passwordWithMd5 !== user.password) {
            logger.warn('[' + email + '][' + password + ']登陆失败');
            return res.status(401).end('用户名或密码错误');
        }
        if(!user.isActive) {
            logger.warn('[' + email + '][********]邮箱未验证用户尝试登录');
            return res.status(401).end('该用户的邮箱未验证');
        }
        req.session.user = email;
        req.session.isAdmin = user.isAdmin;
        req.session.save();
        logger.info('[' + email + '][********]登陆成功');
        User.findOneAndUpdate({email: email}, {$set: {lastLogin: new Date()}}).exec();
        res.send('success');
    });
};

exports.logout = function(req, res) {
    req.session.destroy();
    res.send('logout');
};

exports.sendEmail = function(req, res) {
    var username = req.body.username;
    mail.addMail(username, 1);
    res.send({});
};

exports.activeEmail = function(req, res) {
    var activeKey = req.body.activeKey;
    User.findOneAndUpdate({
        isActive: false,
        activeKey: activeKey,
        sendEmailTime: {$gt: new Date(+new Date() - 15 * 60 * 1000)}
    }, {
        $set: {
            isActive: true
        }
    }).exec(function(err, data) {
        if(err || !data) {
            logger.info('[' + activeKey + ']激活失败');
            return res.status(403).end();
        }
        logger.info('[' + activeKey + '][' + data.email + ']激活成功');
        res.send(data);
        freeAccount.create(data.email);
    });
};

exports.getVersion = (req, res) => res.send(version);

exports.findPassword = (req, res) => {
    var email = req.body.username;
    User.findOne({
        email: email,
        isAdmin: false
    }).exec((err, user) => {
        if(err) {return res.status(500).end('数据库错误');}
        if(!user) {return res.status(403).end('用户不存在');}
        mail.addMail(email, 2);
        return res.send('success');
    });
};

exports.findPasswordUser = (req, res) => {
    req.checkQuery('key', '请求数据格式错误').notEmpty();
    var errors = req.validationErrors();
    if(errors) {
        // console.log(errors);
        return res.status(400).end(errors[0].msg);}
    var key = req.query.key;
    if(!key) {return res.status(400).end('请提供reset key');}
    User.findOne({
        isAdmin: false,
        resetPasswordKey: key
    }).exec((err, user) => {
        if(err) {return res.status(500).end('数据库错误');}
        if(!user) {return res.status(403).end('无效的key');}
        return res.send('success');
    });
};

exports.resetPassword = (req, res) => {
    var key = req.body.key;
    var password = req.body.password;
    if(!key || !password) {return res.status(400).end('请求数据格式错误');}
    User.findOne({
        isAdmin: false,
        resetPasswordKey: key,
    }).exec((err, user) => {
        if(err) {return res.status(500).end('数据库错误');}
        if(!user) {return res.status(403).end('无效的key');}
        User.findOneAndUpdate({
            isAdmin: false,
            resetPasswordKey: key,
            sendResetKeyTime: {
                $gte: moment().add(-15, 'minute').toDate()
            }
        }, {
            $set: {
                password: md5(password + user.email)
            },
            $unset: {
                resetPasswordKey: '',
                sendResetKeyTime: ''
            }
        }).exec((err, user) => {
            if(err) {return res.status(500).end('数据库错误');}
            if(!user) {return res.status(403).end('无效的key');}
            logger.info('[' + user.email + ']重置密码成功');
            return res.send('success');
        });
    });
};