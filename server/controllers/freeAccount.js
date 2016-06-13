var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = mongoose.model('User');
var Server = mongoose.model('Server');


var moment = require('moment');
var async = require('async');

exports.create = function(userName) {
    // console.log(userName);
    var serverName = 'V1';
    var startPort = 39001;
    var createAccount = {};
    createAccount.findServer = function(cb) {
        Server.findOne({name: serverName}).exec(function(err, server) {
            if(err || !server) {return cb('server not found');}
            cb(null, server);
        });
    };
    createAccount.findPort = ['findServer', function(results, cb) {
        Server.aggregate([{
            $match: {name: serverName}
        }, {
            $unwind: '$account'
        }, {
            $project: {
                _id: false,
                name: '$name',
                port: '$account.port'
            }
        }, {
            $group: {
                _id: '$name',
                port: {$max: '$port'}
            }
        }]).exec(function(err, data) {
            if(err || !data.length) {return cb('port not found');}
            return cb(null, data[0]);
        });
    }];
    createAccount.create = ['findPort', function(results, cb) {
        var port = results.findPort.port + 1;

        Server.findOneAndUpdate({
            name: serverName
        }, {
            $push: {account: {
                port: port,
                password: Math.random().toString(36).substr(2, 10),
                expireTime: moment().add(12, 'hour').toDate(),
                flow: 60 * 1000 * 1000,
                autoRemove: true,
            }}
        }).exec(function(err, data) {
            if(err || !data) {return cb('create fail');}
            return cb(null, data);
        });
    }];
    createAccount.modifyUser = ['create', function(results, cb) {
        var port = results.findPort.port + 1;
        User.findOneAndUpdate({email: userName}, {
            $addToSet: {
                account: {
                    server: serverName,
                    port: port
                }
            }
        }).exec(cb);
    }];
    async.auto(createAccount, function(err, data) {

    });
};