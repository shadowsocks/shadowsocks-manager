var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var optionSchema = new Schema({
    name: {type: String, required:true, unique:true},
    value: Schema.Types.Mixed
});

var Option = mongoose.model('Option', optionSchema);