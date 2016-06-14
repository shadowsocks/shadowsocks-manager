var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Option = mongoose.model('Option');

var async = require('async');

exports.getOptions = function (req, res) {
    var getOptions = {};
    var options = {};
    getOptions.freeServer = function(cb) {
        Option.findOne({name: 'freeServer'}).exec(function(err, data) {
            if(err) {return cb(err);}
            options.freeServer = data || {};
            cb(null);
        });
    };
    
};