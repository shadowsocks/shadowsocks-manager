var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var serverSchema = new Schema({
    name: {type:String, required:true, unique:true},
    ip: String,
    port: Number,
    method: String,
    account: [new Schema({
        port: Number,
        password: String,
        color: {type: String, default: 'FFFFFF'},
        expireTime: {type: Date, default: Date.now},
        flow: {type: Number, default: 0},
        status: {type:Number, default: 0},
        autoRemove: {type:Boolean, default: false},
        lastActive: Date
        /*
        status定义: 0 根据expireTime和flow自动开启和关闭
                    1 关闭
                    2 常开
        */
    }, { _id: false })]
});

serverSchema.index({ip: 1, port: 1}, {unique: true});

var Server = mongoose.model('Server', serverSchema);