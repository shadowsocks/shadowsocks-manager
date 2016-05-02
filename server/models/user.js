var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    email: {type:String, required:true, unique:true},
    password: String,
    account: [{
        server: String,
        port: Number
    }],
    isAdmin: {type:Boolean, default: false}
});

var User = mongoose.model('User', userSchema);