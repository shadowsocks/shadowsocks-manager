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

var Server = mongoose.model('Server', serverSchema);