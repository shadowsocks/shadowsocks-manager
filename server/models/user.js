var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    email: {type:String, required:true, unique:true},
    password: String,
    account: [{
        server: String,
        port: Number
    }],
    isAdmin: {type:Boolean, default: false},
    createTime: {type:Date, default: new Date()}
});

var User = mongoose.model('User', userSchema);

User.find({}).exec(function (err, users) {
    if(!err && users.length === 0) {
        var user = new User();
        user.email = 'igyteng@gmail.com';
        user.password = '123456';
        user.isAdmin = true;
        user.save();
    }
});