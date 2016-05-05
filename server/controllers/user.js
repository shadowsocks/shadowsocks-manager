var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = mongoose.model('User');

exports.signup = function(req, res) {

    var email = req.body.username;
    var password = req.body.password;

    User.findOne({email: email}).exec(function(err, data) {
        if(err) {return res.status(500).end('数据库操作错误');}
        else if(data) {return res.status(403).end('该用户已注册');}
        var user = new User();
        user.email = email;
        user.password = password;
        user.save(function(err, data) {
            if(err) {return res.status(500).end('数据库操作错误');}
            return res.send('success');
        });
    });
};

exports.login = function(req, res) {
    var email = req.body.username;
    var password = req.body.password;

    User.findOne({email: email, password: password}).exec(function(err, user) {
        if(err) {return res.status(500).end('数据库操作错误');}
        else if(!user) { return res.status(401).end('用户名密码不匹配');}
        req.session.user = email;
        req.session.isAdmin = user.isAdmin;
        req.session.save();
        res.send('success');
    });
};

exports.logout = function(req, res) {
    req.session.destroy();
    res.send('logout');
};