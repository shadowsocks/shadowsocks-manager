var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var optionSchema = new Schema({
    name: String,
    value: Schema.Types.Mixed
});

var OptionOriginal = mongoose.model('Option', optionSchema);