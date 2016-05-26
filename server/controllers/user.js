var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Server = mongoose.model('Server');
var User = mongoose.model('User');
var async = require('async');

var crypto = require('crypto');
var md5 = function(text) {
        return crypto.createHash('md5').update(text).digest('hex');
};

var createPassword = function(password, username) {
    return md5(password + username);
};

exports.getUserInfo = function (req, res) {
    var userName = req.session.user;

    var step = {};
    step.user = function(callback) {
         User.findOne({email: userName}).exec(function(err, user) {
            if(err || !user) {return callback('err');}
            callback(err, user);
         });
    };
    step.server = function(callback) {
        Server.aggregate([{$unwind: '$account'}]).exec(function(err, data) {
            callback(err, data);
        });
    };
    step.combine = ['user', 'server', function(results, callback) {
        var data = {
            email: results.user.email,
            account: []
        };
        data.account = results.user.account.map(function(m) {
            var server = results.server.filter(function(f) {
                return (f.name === m.server && f.account.port === m.port);
            });
            if(server[0]) {
                return {
                    server: server[0].name,
                    address: server[0].ip,
                    port: server[0].account.port,
                    password: server[0].account.password,
                    flow: server[0].account.flow,
                    expireTime: server[0].account.expireTime,
                    lastActive: server[0].account.lastActive
                };
            } else {
                return null;
            }
        });
        callback(null, data);
    }];
    async.auto(step, function(err, data) {
        if(err) {return res.status(500).end('查询失败');}
        res.send(data.combine);
    });
};



exports.changePassword = function(req, res) {
    if(!req.body.newPassword) {return res.status(401).end('新密码不能为空');}
    if(req.body.newPassword !== req.body.newPasswordAgain) {return res.status(401).end('两次输入的新密码不同');}
    User.findOne({email: req.session.user}).exec(function(err, user) {
        if(err) {return res.status(500).end('数据库错误');}
        if(!user) {return res.status(401).end('找不到对应的用户');}
        if(createPassword(req.body.oldPassword,req.session.user) !== user.password) {return res.status(401).end('原密码错误');}
        User.update({email: req.session.user}, {
            $set: {
                password: createPassword(req.body.newPassword, req.session.user)
            }
        }).exec(function(err, data) {
            if(err) {return res.status(500).end('数据库错误');}
            if(!data.nModified) {return res.status(401).end('找不到对应的用户');}
            req.session.destroy();
            return res.send(data);
        });
    });
};