var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var historyOriginalSchema = new Schema({
    name: String,
    port: Number,
    flow: Number,
    time: {type:Date, default: new Date()}
});

var HistoryOriginal = mongoose.model('HistoryOriginal', historyOriginalSchema);

var historyHourSchema = new Schema({
    name: String,
    port: Number,
    flow: Number,
    time: {type:Date, default: new Date()}
});

var HistoryHour = mongoose.model('HistoryHour', historyHourSchema);