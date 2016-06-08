var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var oneSecondSchema = new Schema({
    user: String,
    time: {type:Date, default: new Date()}
});

var OneSecond = mongoose.model('OneSecond', oneSecondSchema);