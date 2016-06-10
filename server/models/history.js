var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var historyOriginalSchema = new Schema({
    name: String,
    port: Number,
    flow: Number,
    time: {type:Date, default: Date.now}
});

var HistoryOriginal = mongoose.model('HistoryOriginal', historyOriginalSchema);

var historyHourSchema = new Schema({
    name: String,
    port: Number,
    flow: Number,
    time: {type:Date, default: Date.now}
});

var HistoryHour = mongoose.model('HistoryHour', historyHourSchema);