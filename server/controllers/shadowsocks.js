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
exports.add = function (server, account) {
    var socket = dgram.createSocket('udp4');

    var ip   = server.ip;
    var port = server.port;
    var accountPort = account.port;
    var password = account.password;

    var message = 'add: {"server_port": ' + accountPort + ', "password": "' + password + '"}';
    sendMessageToShadowsocks(ip, port, message);
};

exports.del = function (server, account) {
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

var collectUserFlow = function() {
    var sockets = {};
    Server.find({}).exec(function(err, servers) {
        if(err) {return;}
        servers.forEach(function(server) {
            sockets[server.name] = dgram.createSocket('udp4');
            var message = 'ping';
            sockets[server.name].send(message, 0, message.length, server.port, server.ip, function(err, bytes) {
                sockets[server.name].on('error', function() {
                    logger.error('UDP[' + server.name + '] error');
                });
                sockets[server.name].on('message', function(m, r) {
                    var msg = String(m);
                    if(msg.substr(0, 4) === 'stat') {
                        var flow = JSON.parse(msg.substr(6));
                        for(var f in flow) {
                            var ho = new HistoryOriginal();
                            ho.name = server.name;
                            ho.port = +f;
                            ho.flow = flow[f];
                            ho.save();
                        }
                    }
                });
            });
            setInterval(function() {
                sockets[server.name].send(message, 0, message.length, server.port, server.ip);
            }, 90 * 1000);
        });
    });
};
collectUserFlow();