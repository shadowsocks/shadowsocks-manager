var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Server = mongoose.model('Server');
var User = mongoose.model('User');
var Code = mongoose.model('Code');
var OneSecond = mongoose.model('OneSecond');
var async = require('async');
var moment = require('moment');

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
                    method: server[0].method,
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
        User.findOneAndUpdate({email: req.session.user}, {
            $set: {
                password: createPassword(req.body.newPassword, req.session.user)
            }
        }).exec(function(err, data) {
            if(err) {return res.status(500).end('数据库错误');}
            if(!data) {return res.status(401).end('找不到对应的用户');}
            req.session.destroy();
            return res.send(data);
        });
    });
};

exports.useCode = function(req, res) {
    var code = req.body.code;
    var user = req.session.user;
    Code.findOneAndUpdate({code: code, isUsed: false}, {
        $set: {
            isUsed: true,
            useTime: new Date(),
            userName: user
        }
    }).exec(function(err, codeResult) {
        if(err || !codeResult) {return res.status(500).end('数据库错误');}
        res.send(codeResult);
        
        var findAccount = {};
        var updateAccount = {};
        findAccount.findUser = function(cb) {
            User.findOne({email: user}).exec(function(err, user) {
                if(err || !user) {return cb('user not found');}
                cb(null, user);
            });
        };
        findAccount.findServer = ['findUser', function(results, cb) {
            results.findUser.account.forEach(function(account) {
                updateAccount[account.server + (+account.port)] = function(cb) {
                    Server.findOne({name: account.server, 'account.port': account.port}).exec(function(err, data) {
                        if(err || !data) {return cb('server not found');}
                        var ret = data.account.filter(function(f) {
                            return +f.port === +account.port;
                        })[0];
                        if(!ret) {return cb('server not found');}
                        cb(null, ret);
                    });
                };
                updateAccount[account.server + (+account.port) + 'update'] = [account.server + (+account.port), function(results, cb) {
                    Server.findOneAndUpdate({
                        name: account.server,
                        'account.port': account.port
                    }, {
                        $set: {
                            'account.$.flow': results[account.server + (+account.port)].flow + codeResult.flow,
                            'account.$.expireTime': new Date(codeResult.time + (+results[account.server + (+account.port)].expireTime))
                        }
                    }).exec(function(err, data) {
                        if(err || !data) {return cb('server update not fail');}
                        cb(null, data);
                    });
                }];
                
            });
            return cb(null, 'Server');
        }];

        async.auto(findAccount, function(err, result) {
            if(err) {return;}
            async.auto(updateAccount);
        });
    });
};

exports.oneSecond = function(req, res) {
    var startTime = moment().hour(0).minute(0).second(0).millisecond(0).toDate();
    var endTime = moment(startTime).add(1, 'day').toDate();
    var userName = req.session.user;
    OneSecond.findOne({
        user: userName,
        time: {
            $gte: startTime,
            $lt: endTime
        }
    }).exec(function(err, data) {
        if(err) {
            return res.status(500).end();
        }
        if(data) {
            return res.status(403).end('今天已经续过了，请明天再试');
        }
        var oneSecond = new OneSecond();
        oneSecond.user = userName;
        oneSecond.save(function() {
            res.send('GGG');
        });
    });

};