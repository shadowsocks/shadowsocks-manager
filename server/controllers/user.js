var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Server = mongoose.model('Server');
var User = mongoose.model('User');
var async = require('async');

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
                    expireTime: server[0].account.expireTime
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