var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var oneSecondSchema = new Schema({
    user: String,
    time: {type:Date, default: Date.now}
});

var OneSecond = mongoose.model('OneSecond', oneSecondSchema);