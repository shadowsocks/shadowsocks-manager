var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var accountSchema = new Schema({
    server: {type:String, required:true},
    port: {type:Number, required:true},
}, { _id: false });

var userSchema = new Schema({
    email: {type:String, required:true, unique:true},
    password: String,
    account: [accountSchema],
    signupIp: String,
    signupFp: String,
    isActive: {type:Boolean, default: false},
    activeKey: String,
    sendEmailTime: Date,
    resetPasswordKey: String,
    sendResetKeyTime: Date,
    isAdmin: {type:Boolean, default: false},
    createTime: {type:Date, default: Date.now},
    lastLogin: Date
});

var User = mongoose.model('User', userSchema);

var crypto = require('crypto');
var md5 = function(text) {
    return crypto.createHash('md5').update(text).digest('hex');
};

var createPassword = function(password, username) {
    return md5(password + username);
};

var config = require('../../config').conf;

User.find({}).exec(function (err, users) {
    if(!err && users.length === 0) {
        var user = new User();
        user.email = config.admin.email;
        user.isAdmin = true;
        user.createTime = new Date();
        user.isActive = true;
        user.password = createPassword(config.admin.password, user.email);
        user.save();
    }
});