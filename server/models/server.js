var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var serverSchema = new Schema({
    name: {type:String, required:true, unique:true},
    ip: String,
    port: Number,
    account: [new Schema({
        port: {type:Number, required:true, unique:true},
        password: String,
        expireTime: {type: Date, default: new Date()},
        flow: {type: Number, default: 0},
        status: {type:Number, default: 0}
        /*
        status定义: 0 根据expireTime和flow自动开启和关闭
                    1 关闭
                    2 常开
        */
    }, { _id: false })]
});

serverSchema.index({ip: 1, port: 1}, {unique: true});

var Server = mongoose.model('Server', serverSchema);