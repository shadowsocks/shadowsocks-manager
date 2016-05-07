var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var serverSchema = new Schema({
    name: {type:String, required:true, unique:true},
    ip: String,
    port: Number,
    account: [{
        port: Number,
        password: String,
        expireTime: Date
    }]
});

serverSchema.index({ip: 1, port: 1}, {unique: true});

var Server = mongoose.model('Server', serverSchema);