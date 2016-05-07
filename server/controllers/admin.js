var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Server = mongoose.model('Server');

var shadowsocks = require('./shadowsocks');

exports.addServer = function (req, res) {
    var name = req.body.name;
    var ip = req.body.ip;
    var port = req.body.port;
    

    var server = new Server();
    
    server.name = name;
    server.ip = ip;
    server.port = port;

    server.save(function(err, data) {
        if(err) {return res.status(500).end('数据库错误');}
        return res.send(data);
    });
};

exports.getServers = function (req, res) {
    Server.find({}).exec(function(err, servers) {
        if(err) {return res.status(500).end('数据库错误');}
        return res.send(servers);
    });
};

exports.addServerPort = function(req, res) {
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
        if(err) {return res.status(500).end('数据库错误');}
        // console.log(data);
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