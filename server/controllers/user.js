var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = mongoose.model('User');

exports.signup = function(req, res) {

    var email = req.body.username;
    var password = req.body.password;

    User.findOne({email: email}).exec(function(err, data) {
        if(err || data) {return res.status(400).end();}
        var user = new User();
        user.email = email;
        user.password = password;
        user.save(function(err, data) {
            if(err) {return res.status(400).end();}
            return res.send('success');
        });
    });
};

exports.login = function(req, res) {
    var email = req.body.username;
    var password = req.body.password;

    User.findOne({email: email, password: password}).exec(function(err, user) {
        if(err || !user) {
            return res.status(400).end();
        }
        req.session.user = email;
        req.session.isAdmin = user.isAdmin;
        req.session.save();
        res.send('success');
    });
};