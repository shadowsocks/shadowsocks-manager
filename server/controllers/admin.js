var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Server = mongoose.model('Server');
var User = mongoose.model('User');
var HistoryOriginal = mongoose.model('HistoryOriginal');
var moment = require('moment');

var log4js = require('log4js');
var logger = log4js.getLogger('admin');

var shadowsocks = require('./shadowsocks');

exports.getServers = function (req, res) {
    var query = {};
    if(req.query.serverName) {
        query.name = req.query.serverName;
    }
    Server.find(query).exec(function(err, servers) {
        if(err) {return res.status(500).end('数据库错误');}
        return res.send(servers);
    });
};

exports.addServer = function (req, res) {
    var name = req.body.name;
    var ip = req.body.ip;
    var port = req.body.port;
    

    var server = new Server();
    
    server.name = name;
    server.ip = ip;
    server.port = port;

    server.save(function(err, data) {
        if(err) {

            return res.status(500).end('数据库错误');
        }
        logger.info('新增服务器: [' + name + '][' + ip + ':' + port + ']');
        return res.send(data);
    });
};

exports.editServer = function(req, res) {
    var name = req.body.name;
    var ip = req.body.ip;
    var port = req.body.port;

    Server.findOneAndUpdate({name: name}, {
        $set: {
            ip: ip,
            port: port
        }
    }).exec(function(err, data) {
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

    Server.findOneAndUpdate({
        name: name
    }, {
        $push: {account: {
            port: port,
            password: password,
            expireTime: new Date()
        }}
    }).exec(function(err, data) {
        if(err) {
            logger.error('[addAccount]' + err);
            return res.status(500).end('数据库错误');}
        shadowsocks.add({
            ip: data.ip,
            port: data.port
        }, {
            port: port,
            password: password
        });
        return res.send(data);
    });
};

exports.editAccount = function(req, res) {
    var name = req.body.name;
    var port = req.body.port;
    var flow = req.body.flow;
    var time = req.body.time;

    var update = {};
    if(flow) {
        update.$inc = {
            'account.$.flow': +flow
        };
    }
    if(time) {
        update.$set = {
            'account.$.expireTime': new Date(+new Date() + time)
        };
    }

    Server.findOneAndUpdate({
        'name': name,
        'account.port': port
    }, update).exec(function(err, data) {
        if(err) {return res.status(500).end('数据库错误');}
        if(!data) {return res.status(401).end('找不到相应帐号');}
        return res.send(data);
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
    var date = moment().hour(0).minute(0).second(0).toDate();
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
            flow: {
                $sum: '$flow'
            },
        }
    });
    aggregate.push({
        $project: {
            _id: false,
            name: '$_id.name',
            port: '$_id.port',
            flow: '$flow'
        }
    });
    HistoryOriginal.aggregate(aggregate).exec(function(err, data) {
        if(err) {return res.status(500).end('数据库错误');}
        res.send(data);
    });
};

exports.getUsers = function(req, res) {
    var query = {isAdmin: false};
    if(req.query.userName) {
        query.email = req.query.userName;
    }
    User.find(query).exec(function(err, data) {
        if(err) {return res.status(500).end('数据库错误');}
        res.send(data);
    });
};