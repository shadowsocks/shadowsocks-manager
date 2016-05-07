// 'use strict';
// console.log('GG');
var dgram = require('dgram');
// var socket = dgram.createSocket('udp4');
/*
add: {"server_port": 8001, "password":"7cd308cc059"}
remove: {"server_port": 8001}
*/

// var express = require('express');
var app = global.app;

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
    console.log('Send message to [' + ip + ':' + port + ']: ' + message);
    socket.send(message, 0, message.length, port, ip, function(err, bytes) {
        socket.on('message', function(m, r) {
            socket.close();
        });
    });
};