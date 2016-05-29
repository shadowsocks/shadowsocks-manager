var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Server = mongoose.model('Server');
var User = mongoose.model('User');
var HistoryOriginal = mongoose.model('HistoryOriginal');
var moment = require('moment');

var log4js = require('log4js');
var logger = log4js.getLogger('admin');

var async = require('async');

var shadowsocks = require('./shadowsocks');

exports.getServers = function (req, res) {
    var query = {};
    if(req.query.name) {query.name = req.query.name;}
    Server.find(query).exec(function(err, servers) {
        if(err) {return res.status(500).end('数据库错误');}
        return res.send(servers);
    });
};

exports.addServer = function (req, res) {
    var name = req.body.name;
    var ip = req.body.ip;
    var port = req.body.port;
    var method = req.body.method;

    var server = new Server();
    server.name = name;
    server.ip = ip;
    server.port = port;

    server.save(function(err, data) {
        if(err) {return res.status(500).end('数据库错误'); }
        logger.info('新增服务器: [' + req.body.name + '][' + req.body.ip + ':' + req.body.port + ']');
        return res.send(data);
    });
};

exports.editServer = function(req, res) {
    var name = req.body.name;
    var ip = req.body.ip;
    var port = req.body.port;
    var method = req.body.method;

    Server.findOneAndUpdate({name: name}, {
        $set: {
            ip: ip,
            port: port,
            method: method
        }
    }, {new: true}).exec(function(err, data) {
        if(err) {return res.status(500).end('数据库错误');}
        if(!data) {return res.status(401).end('找不到ServerName');}
        logger.info('修改服务器: [' + name + '][' + ip + ':' + port + ']');
        return res.send(data);
    });
};

exports.deleteServer = function(req, res) {
    var name = req.query.name;
    if(!name) {return res.status(401).end('必须提供ServerName');}
    Server.findOneAndRemove({name: name}).exec(function(err, data) {
        if(err) {return res.status(500).end('数据库错误');}
        if(!data) {return res.status(401).end('找不到ServerName');}
        logger.info('删除服务器: [' + data.name + '][' + data.ip + ':' + data.port + ']');
        return res.send(data);
    });
};



exports.addAccount = function(req, res) {
    var name = req.body.name;
    var port = req.body.port;
    var password = req.body.password;

    Server.findOne({
        'name': name,
        'account.port': port
    }).then(function(success) {
        if(success) {
            res.status(403).end('该端口已被占用');
            return Promise.reject('端口被占用');
        }
        return Server.findOneAndUpdate({
            name: name
        }, {
            $push: {account: {
                port: port,
                password: password,
                expireTime: new Date()
            }}
        }, {new: true});
    }).then(function(success) {
        shadowsocks.add({
            ip: success.ip,
            port: +success.port
        }, {
            port: +port,
            password: password
        });
        var ret = success.account.filter(function(f) {
            return +f.port === +port;
        })[0];
        return res.send(ret);
    }).catch(function(err) {
        logger.error('[addAccount]' + err);
        return res.status(500).end('数据库错误');
    });
};

exports.editAccount = function(req, res) {
    var type = req.body.type;
    var name = req.body.name;
    var port = req.body.port;
    var flow = req.body.flow;
    var time = req.body.time;

    var update = function(number) {
        var update = {};
        if((flow || flow === 0) && type === 'add') {
            update.$inc = {
                'account.$.flow': +flow
            };
        } else if((flow || flow === 0) && type === 'set') {
            update.$set = {
                'account.$.flow': +flow
            };
        } else if((time || time === 0) && type === 'set') {
            update.$set = {
                'account.$.expireTime': new Date(+new Date() + time)
            };
        } else if((time || time === 0) && type === 'add') {
            update.$set = {
                'account.$.expireTime': new Date(+number + time)
            };
        }
        return update;
    };

    Server.findOne({
        'name': name,
        'account.port': port
    }).then(function(data) {
        var time = data.account.filter(function(f) {
            return +f.port === +port;
        })[0].expireTime;
        return Server.findOneAndUpdate({
            'name': name,
            'account.port': port
        }, update(time), {new: true});
    }).then(function(data) {
        if(!data) {return res.status(401).end('找不到相应帐号');}
        var ret = data.account.filter(function(f) {
            return +f.port === +port;
        })[0];
        return res.send(ret);
    }).catch(function(err) {
        return res.status(500).end('数据库错误');
    });
};

exports.deleteAccount = function(req, res) {
    var name = req.query.name;
    var port = req.query.port;

    Server.findOneAndUpdate({
        'name': name,
        'account.port': port
    }, {$pull: {
        account: {port: port}
    }}).exec(function(err, data) {
        if(err) {return res.status(500).end('数据库错误');}
        if(!data) {return res.send(data);}
        shadowsocks.del({
            ip: data.ip,
            port: data.port
        }, {
            port: port
        });
        return res.send(data);
    });
};

exports.addUserAccount = function(req, res) {
    var name = req.body.name;
    var serverName = req.body.serverName;
    var port = req.body.port;
    if(!name || !serverName || !port) {return res.status(400).end('缺少必要的字段');}
    User.findOneAndUpdate({email: name}, {
        $addToSet: {
            account: {
                server: serverName,
                port: port
            }
        }
    }).exec(function(err, data) {
        if(err) {return res.status(500).end('数据库错误');}
        if(!data) {return res.status(401).end('找不到对应数据');}
        return res.send(data);
    });
};

exports.deleteUserAccount = function(req, res) {
    var name = req.query.name;
    var serverName = req.query.server;
    var port = req.query.port;
    if(!name || !serverName || !port) {return res.status(400).end('缺少必要的字段');}
    User.findOneAndUpdate({email: name}, {
        $pull: {
            account: {
                server: serverName,
                port: port
            }
        }
    }).exec(function(err, data) {
        if(err) {return res.status(500).end('数据库错误');}
        if(!data) {return res.status(401).end('找不到对应数据');}
        return res.send(data);
    });
};

exports.getFlow = function(req, res) {
    var aggregate = [];

    var now = new Date();
    var date = moment(now).add(-39, 'd').hour(0).minute(0).second(0).toDate();

    var time = {
        today: moment(now).hour(0).minute(0).second(0).toDate(),
        week: moment(now).day(0).hour(0).minute(0).second(0).toDate(),
        month: moment(now).date(1).hour(0).minute(0).second(0).toDate(),
    };
    aggregate.push({
        $match: {
            time: {$gt: date}
        }
    });
    aggregate.push({
        $group: {
            _id: {
                name: '$name',
                port: '$port'
            },
            flowToday: {
                $sum: {$cond: [{$gte: ['$time', time.today]}, '$flow', 0]}
            },
            flowWeek: {
                $sum: {$cond: [{$gte: ['$time', time.week]}, '$flow', 0]}
            },
            flowMonth: {
                $sum: {$cond: [{$gte: ['$time', time.month]}, '$flow', 0]}
            },
        }
    });
    aggregate.push({
        $project: {
            _id: false,
            name: '$_id.name',
            port: '$_id.port',
            today: '$flowToday',
            week: '$flowWeek',
            month: '$flowMonth'
        }
    });
    HistoryOriginal.aggregate(aggregate).exec(function(err, data) {
        console.log((new Date() - now) + ' ms');
        if(err) {return res.status(500).end('数据库错误');}
        res.send(data);
    });
};

exports.getUsers = function(req, res) {
    var query = {isAdmin: false};
    if(req.query.userName) {
        query.email = req.query.userName;
    }

    var step = {};

    step.user = function(callback) {
        User.find(query).exec(callback);
    };
    step.server = function(callback) {
        Server.aggregate([{$unwind: '$account'}]).exec(function(err, data) {
            callback(err, data);
        });
    };
    step.combine = ['user', 'server', function(results, callback) {
        var data = results.user.map(function(m) {
            return {
                email: m.email,
                account: m.account.map(function(m) {
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
                })
            };
        });
        callback(null, data);
    }];
    async.auto(step, function(err, data) {
        if(err) {return res.status(500).end('查询失败');}
        res.send(data.combine);
    });
};