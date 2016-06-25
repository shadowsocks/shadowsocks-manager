var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var mailSchema = new Schema({
    email: {type:String, required:true},
    type: Number,
        // 1 用户激活码邮件
        // 2 找回密码邮件
    send: Boolean,
    sendTime: Date
});

var Mail = mongoose.model('Mail', mailSchema);