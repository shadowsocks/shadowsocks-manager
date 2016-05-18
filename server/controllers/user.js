var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Server = mongoose.model('Server');
var User = mongoose.model('User');
var async = require('async');

exports.getUserInfo = function (req, res) {
    var userName = req.session.user;
    console.log(userName);
    User.findOne({
        email: userName
    }).exec(function(err, user) {
        if(err || !user) {
            return res.status(500).end('无法找到相应用户数据');
        }

    });
};