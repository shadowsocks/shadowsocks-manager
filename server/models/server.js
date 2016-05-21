var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var serverSchema = new Schema({
    name: {type:String, required:true, unique:true},
    ip: String,
    port: Number,
    account: [new Schema({
        port: Number,
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

serverSchema.statics.searchByName = function(name, cb) {
    var query = {};
    if(name) {query.name = name;}
    return this.find(query).exec(cb);
};

serverSchema.statics.newServer = function(serverInfo, cb) {
    if(!serverInfo) {return cb('服务器信息不完整');}

    var name = serverInfo.name;
    var ip = serverInfo.ip;
    var port = serverInfo.port;

    var server = new Server();
    server.name = name;
    server.ip = ip;
    server.port = port;
    
    return server.save(cb);
};

var Server = mongoose.model('Server', serverSchema);