var dgram = require('dgram');
var mongoose = require('mongoose');
var Server = mongoose.model('Server');
var HistoryOriginal = mongoose.model('HistoryOriginal');
/*
add: {"server_port": 8001, "password":"7cd308cc059"}
remove: {"server_port": 8001}
*/

var app = global.app;
var log4js = require('log4js');
var logger = log4js.getLogger('shadow');
/*
server: {
    ip: '',
    port: ''
}
account: {
    port: '',
    password: ''
}
*/
var add = exports.add = function (server, account) {
    var socket = dgram.createSocket('udp4');

    var ip   = server.ip;
    var port = server.port;
    var accountPort = account.port;
    var password = account.password;

    var message = 'add: {"server_port": ' + accountPort + ', "password": "' + password + '"}';
    sendMessageToShadowsocks(ip, port, message);
};

var del = exports.del = function (server, account) {
    var socket = dgram.createSocket('udp4');

    var ip   = server.ip;
    var port = server.port;
    var accountPort = account.port;

    var message = 'remove: {"server_port": ' + accountPort + '}';
    sendMessageToShadowsocks(ip, port, message);
};

var sendMessageToShadowsocks = function(ip, port, message) {
    var socket = dgram.createSocket('udp4');
    logger.info('Send message to [' + ip + ':' + port + ']: ' + message);
    socket.send(message, 0, message.length, port, ip, function(err, bytes) {
        socket.on('message', function(m, r) {
            socket.close();
        });
    });
};


// var collectUserFlow = function() {
//     var sockets = {};
//     Server.find({}).exec(function(err, servers) {
//         if(err) {return;}
//         servers.forEach(function(server) {
//             sockets[server.name] = dgram.createSocket('udp4');
//             var message = 'ping';
//             sockets[server.name].send(message, 0, message.length, server.port, server.ip, function(err, bytes) {
//                 sockets[server.name].on('error', function() {
//                     logger.error('UDP[' + server.name + '] error');
//                 });
//                 sockets[server.name].on('message', function(m, r) {
//                     var msg = String(m);
//                     if(msg.substr(0, 4) === 'stat') {
//                         var flow = JSON.parse(msg.substr(6));
//                         for(var f in flow) {
//                             var ho = new HistoryOriginal();
//                             ho.name = server.name;
//                             ho.port = +f;
//                             ho.flow = flow[f];
//                             ho.save();
//                         }
//                     }
//                 });
//             });
//             setInterval(function() {
//                 sockets[server.name].send(message, 0, message.length, server.port, server.ip);
//             }, 90 * 1000);
//         });
//     });
// };
// collectUserFlow();

var servers = {};
var startSocket = function(server) {
    servers[server.name] = dgram.createSocket('udp4');
    var message = 'ping';
    servers[server.name].send(message, 0, message.length, server.port, server.ip, function(err, bytes) {
        servers[server.name].on('error', function() {
            logger.error('UDP[' + server.name + '] error');
        });
        servers[server.name].on('message', function(m, r) {
            var msg = String(m);
            if (msg.substr(0, 4) === 'stat') {
                var flow = JSON.parse(msg.substr(6));
                for (var f in flow) {
                    var ho = new HistoryOriginal();
                    ho.name = server.name;
                    ho.port = +f;
                    ho.flow = flow[f];
                    ho.save();

                    Server.findOneAndUpdate({
                        'name': server.name,
                        'account.port': +f 
                    }, {
                        $inc: {
                            'account.$.flow': 0 - flow[f]
                        }
                    }).exec();
                }
            }
        });
    });
    servers[server.name].interval = setInterval(function() {
        servers[server.name].send(message, 0, message.length, server.port, server.ip);
    }, 90 * 1000);
};
var stopSocket = function(name) {
    clearInterval(servers[name].interval);
    servers[name].close();
    delete servers[name];
};

exports.updateServerList = function() {
    Server.find({}).exec(function(err, data) {
        if(err) { return; }
        data.forEach(function(server) {
            if(!servers[server.name]) {
                startSocket(server);
            }
        });
        for(var s in servers) {
            if(!data.filter(function(f) {
                return f.name === s;
            })[0]) {
                stopSocket(s);
            }
        }
    });
};

exports.checkAccount = function() {
    Server.find({}).exec(function(err, data) {
        if (err) {
            return;
        }
        data.forEach(function(server) {
            server.account.forEach(function(f) {
                if (f.status === 0) {
                    if (f.flow > 0 && f.expireTime - new Date() > 0) {
                        add({
                            ip: server.ip,
                            port: server.port
                        }, {
                            port: f.port,
                            password: f.password
                        });
                    } else {
                        del({
                            ip: server.ip,
                            port: server.port
                        }, {
                            port: f.port
                        });
                    }
                }
            });

        });
    });
};