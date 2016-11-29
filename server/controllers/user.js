var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Server = mongoose.model('Server');
var User = mongoose.model('User');
var Code = mongoose.model('Code');
var OneSecond = mongoose.model('OneSecond');
var Option = mongoose.model('Option');
var async = require('async');
var moment = require('moment');

var log4js = require('log4js');
var logger = log4js.getLogger('admin');

var freeAccount = require('./freeAccount');
var shadowsocks = require('./shadowsocks');

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
    if(!req.body.newPassword) {return res.status(400).end('新密码不能为空');}
    if(req.body.newPassword !== req.body.newPasswordAgain) {return res.status(400).end('两次输入的新密码不同');}
    User.findOne({email: req.session.user}).exec(function(err, user) {
        if(err) {return res.status(500).end('数据库错误');}
        if(!user) {return res.status(403).end('找不到对应的用户');}
        if(createPassword(req.body.oldPassword,req.session.user) !== user.password) {return res.status(403).end('原密码错误');}
        User.findOneAndUpdate({email: req.session.user}, {
            $set: {
                password: createPassword(req.body.newPassword, req.session.user)
            }
        }).exec(function(err, data) {
            if(err) {return res.status(500).end('数据库错误');}
            if(!data) {return res.status(403).end('找不到对应的用户');}
            req.session.destroy();
            return res.send(data);
        });
    });
};

exports.changeShadowsocksPassword = function(req, res) {
    var newPassword = req.body.password;
    if(!newPassword) {
      return res.status(403).end();
    };
    User.findOne({email: req.session.user}).then(function(success) {
        success.account.forEach(function(account) {
            Server.findOneAndUpdate({
              name: account.server,
              'account.port': account.port
            }, {
              $set: {
                'account.$.password': newPassword
              }
            }).exec(function(err, server) {
              shadowsocks.del({
                ip: server.ip,
                port: server.port
              }, {
                port: account.port
              });
              setTimeout(function() {
                shadowsocks.add({
                  ip: server.ip,
                  port: server.port
                }, {
                  port: account.port,
                  password: newPassword
                });
              }, 1000);
            });
        });
        res.send('success');
    }).catch(function(err) {
      return res.status(403).end();
    });

};

exports.useCode = function(req, res) {
    var code = req.body.code;
    var user = req.session.user;
    if(!code) {return res.status(400).end();}
    if(code) {code = code.toLowerCase();}
    var steps = {};

    steps.getUserInfo = (cb) => {
        User.findOne({email: user}).exec((err, user) => {
            if(err || !user) {return cb('User not found');}
            return cb(null, user);
        });
    };
    steps.getCodeInfo = ['getUserInfo', (results, cb) => {
        Code.findOneAndUpdate({
            code: code,
            isUsed: false
        }, {
            $set: {
                isUsed: true,
                useTime: Date.now(),
                userName: user
            }
        }).exec((err, code) => {
            if(err || !code) {return cb('Code not found');}
            logger.info('续费码[' + code.code + '][' + user + ']使用成功');
            return cb(null, code);
        });
    }];
    steps.getAccount = ['getCodeInfo', (results, cb) => {
        if(!results.getUserInfo.account.length) {
            Server.aggregate([
                {$sample: { size: 1 }
            }]).exec((err, server) => {
                if(err) {return cb(err);}
                if(!server) {return cb('Server not found');}
                if(!server[0]) {return cb('Server not found');}
                freeAccount.create(user, server[0].name, results.getCodeInfo.time/1000, results.getCodeInfo.flow, (err, data) => {
                    if(err) {return cb(err);}
                    return cb(null, user);
                });
            });
        } else {
            cb(null, results.getUserInfo.account);
        }
    }];
    var parallel = [];
    var accountParallel = (account, flow, time) => {
        account.forEach((a) => {
            parallel.push((cb) => {
                Server.findOne({
                    'name': a.server,
                    'account.port': a.port
                }).exec((err, data) => {
                    if(err || !data) {cb('Account not found');}
                    var accountInfo = data.account.filter((f) => {
                        return f.port === a.port;
                    })[0];
                    Server.findOneAndUpdate({
                        'name': a.server,
                        'account.port': a.port
                    }, {
                        $set: {
                            'account.$.flow': accountInfo.flow + flow,
                            'account.$.expireTime': accountInfo.expireTime + time
                        }
                    }).exec((err, data) => {
                        console.log(err, data);
                        if(err || !data) {return cb('Account not found');}
                        return cb(null);
                    });
                });
            });
        });
    };

    async.auto(steps, (err, data) => {
        if(err) {return res.status(403).end();}
        if(Array.isArray(data.getAccount)) {
            accountParallel(data.getAccount, data.getCodeInfo.flow, data.getCodeInfo.time);
            async.parallel(parallel, (err, data) => {
                if(err) {return res.status(403).end();}
                return res.send('success');
            });
        } else {
            return res.send('success');
        }
    });
    // User.findOne({email: user}).exec(function(e, u) {
    //     if(e) {return res.status(500).end('数据库错误');}
    //     if(!u) {return res.status(403).end('用户不存在');}
    //     if(u.account.length === 0) {return res.status(403).end('该用户尚未分配帐号，无法使用续费码');}
    //     Code.findOneAndUpdate({code: code, isUsed: false}, {
    //         $set: {
    //             isUsed: true,
    //             useTime: new Date(),
    //             userName: user
    //         }
    //     }).exec(function(err, codeResult) {
    //         if(err || !codeResult) {return res.status(500).end('数据库错误');}
    //         res.send(codeResult);

    //         var findAccount = {};
    //         var updateAccount = {};
    //         findAccount.findUser = function(cb) {
    //             User.findOne({email: user}).exec(function(err, user) {
    //                 if(err || !user) {return cb('user not found');}
    //                 cb(null, user);
    //             });
    //         };
    //         findAccount.findServer = ['findUser', function(results, cb) {
    //             results.findUser.account.forEach(function(account) {
    //                 updateAccount[account.server + (+account.port)] = function(cb) {
    //                     Server.findOne({name: account.server, 'account.port': account.port}).exec(function(err, data) {
    //                         if(err || !data) {return cb('server not found');}
    //                         var ret = data.account.filter(function(f) {
    //                             return +f.port === +account.port;
    //                         })[0];
    //                         if(!ret) {return cb('server not found');}
    //                         cb(null, ret);
    //                     });
    //                 };
    //                 updateAccount[account.server + (+account.port) + 'update'] = [account.server + (+account.port), function(results, cb) {
    //                     Server.findOneAndUpdate({
    //                         name: account.server,
    //                         'account.port': account.port
    //                     }, {
    //                         $set: {
    //                             'account.$.flow': results[account.server + (+account.port)].flow + codeResult.flow,
    //                             'account.$.expireTime': new Date(codeResult.time + (+results[account.server + (+account.port)].expireTime))
    //                         }
    //                     }).exec(function(err, data) {
    //                         if(err || !data) {return cb('server update not fail');}
    //                         cb(null, data);
    //                     });
    //                 }];

    //             });
    //             return cb(null, 'Server');
    //         }];

    //         async.auto(findAccount, function(err, result) {
    //             if(err) {return;}
    //             async.auto(updateAccount);
    //         });
    //     });
    // });
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
        oneSecond.save(function(err, data) {
            if(err) {
                return res.status(500).end();
            }
            logger.info('用户[' + userName + ']成功续了一秒');
            oneSecondAccount(userName);
            return res.send(data);
        });
    });
};

var oneSecondAccount = function(userName) {
    var flow;
    var time;

    var getAccountInfo = {};
    var parallel = [];
    getAccountInfo.getOption = (cb) => {
        Option.findOne({name: 'oneSecond'}).exec((err, option) => {
            if(err || !option || !option.value) {return cb('option not found');}
            flow = option.value.flow;
            time = option.value.time;
            if(!flow || !time) {return cb('value not found');}
            return cb(null, option);
        });
    };
    getAccountInfo.getUser = ['getOption', function(results, cb) {
        User.findOne({email: userName}).exec(function(err, user) {
            if(err) {return cb(err);}
            if(!user) {return cb('user not found');}
            if(!user.account.length) {
                Server.aggregate([{$sample:
                    { size: 1 }
                }]).exec(function(err, server) {
                    if(err) {return cb(err);}
                    if(!server) {return cb('server not found');}
                    if(!server[0]) {return cb('server not found');}
                    freeAccount.create(userName, server[0].name, time, flow, function(err, data) {
                        if(err) {return cb(err);}
                        return cb(null, user);
                    });
                });
            } else {
                cb(null, user);
            }
        });
    }];
    getAccountInfo.getAccount = ['getUser', function(results, cb) {
        results.getUser.account.forEach(function(f) {
            parallel.push(function(cb) {
                Server.findOne({name: f.server}).exec(function(err, server) {
                    if(err || !server) {return cb(null);}
                    var account = server.account.filter(function(account) {
                        return +account.port === +f.port;
                    })[0];
                    if(!account) {return cb(null);}
                    if(account.flow < flow) {
                        Server.findOneAndUpdate({
                            name: f.server,
                            'account.port': +f.port
                        }, {
                            $set: {
                                'account.$.flow': flow
                            }
                        }).exec();
                    }
                    if(account.expireTime - Date.now() < time * 1000) {
                        Server.findOneAndUpdate({
                            name: f.server,
                            'account.port': +f.port
                        }, {
                            $set: {
                                'account.$.expireTime': new Date(+Date.now() + time * 1000)
                            }
                        }).exec();
                    }
                });
            });
            cb(null);
        });
    }];
    async.auto(getAccountInfo, function(err, data) {
        async.parallel(parallel);
    });
};
