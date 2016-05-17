var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var accountSchema = new Schema({
    server: {type:String, required:true},
    port: {type:Number, required:true},
}, { _id: false });

accountSchema.index({server: 1, port: 1}, {unique: true});

var userSchema = new Schema({
    email: {type:String, required:true, unique:true},
    password: String,
    account: [accountSchema],
    isAdmin: {type:Boolean, default: false},
    createTime: {type:Date, default: new Date()}
});

var User = mongoose.model('User', userSchema);

var crypto = require('crypto');
var md5 = function(text) {
        return crypto.createHash('md5').update(text).digest('hex');
};

var createPassword = function(password, username) {
    return md5(password + username);
};

User.find({}).exec(function (err, users) {
    if(!err && users.length === 0) {
        var user = new User();
        user.email = 'igyteng@gmail.com';
        user.isAdmin = true;
        user.createTime = new Date();
        user.password = createPassword('123456', user.email);
        user.save();
    }
});