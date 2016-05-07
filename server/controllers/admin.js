var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Server = mongoose.model('Server');

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