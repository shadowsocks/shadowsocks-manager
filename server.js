var dgram = require('dgram');
var socket = dgram.createSocket('udp4');
var message = new Buffer('ping');
var moment = require('moment');
// var fs = require('fs');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/ss');
var Schema = mongoose.Schema;


var userSchema = new Schema({
    userName:  String,
    userId  :  String,
    history : [{ time: Date, number: Number }]
});
var User = mongoose.model('User', userSchema);
// var message = new Buffer('add: {"server_port": 40123, "password":"fuckgfw"}');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    // console.log('GG');
    // User.find({}).exec(function(e,d) {console.log(e,d);});
});

// var rate = {};
// var myRate = 0;

// var writeRate = function(num) {
//     myRate = num;
//     fs.readFile('./rate.txt', function(err, data) {
//         if(!err) {
//             myRate = (+data) + num;
//         }
//         fs.writeFile('./rate.txt', '' + myRate, function() {

//         });
//     });
// };


socket.send(message, 0, message.length, 6001, '127.0.0.1', function(err, bytes) {
    socket.on('message', function(m, r) {
        var msg = String(m);
        console.log(msg);
        if(msg.substr(0,5) === 'stat:') {
            var newRate = JSON.parse(msg.substr(6));
            // console.log(newRate);
            var num = 0;
            for(var nr in newRate) {
                User.findOneAndUpdate({
                    userId: nr
                }, {
                    $push: {history: {time: new Date(), number: +newRate[nr]}}
                }, {upsert: true}).exec(function(e, d) {
                    // console.log(e,d);
                });
                // num += (+newRate[nr]);
                // if(!rate[nr]) {
                //     rate[nr] = (+newRate[nr]);
                // } else {
                //     rate[nr] += (+newRate[nr]);
                // }
            }
            // console.log(rate);
        }
    });
});

var express = require('express');
var app = express();

app.use(express.static('public'));

app.get('/rate', function (req, res) {
    var today = moment().hour(0).minute(0).second(0).millisecond(0).toDate();
    var week  = moment().weekday(0).hour(0).minute(0).second(0).millisecond(0).toDate();
    var month = moment().date(0).hour(0).minute(0).second(0).millisecond(0).toDate();
    User.aggregate([
        {'$unwind': '$history'},
        {'$project': {
            'userId': '$userId', 'number': '$history.number', 'time': '$history.time'
        }},
        {'$group':
            {
                '_id': '$userId',
                'userId': {'$first': '$userId'},
                'all': {'$sum': '$number'},
                'today': {
                    '$sum': {
                        '$cond': [ {'$gte': ['$time', today]}, '$number', 0]
                    }
                },
                'week': {
                    '$sum': {
                        '$cond': [ {'$gte': ['$time', week]}, '$number', 0]
                    }
                },
                'month': {
                    '$sum': {
                        '$cond': [ {'$gte': ['$time', month]}, '$number', 0]
                    }
                }
            }
        }
    ]).exec(function(e, d) {
        console.log(e, d);
        if(e) {return res.status(500).end;}
        res.send(d);
    });
    // res.send(rate);
});

// app.get('/allRate', function (req, res) {
//     User.aggregate([
//         {'$unwind': '$history'},
//         {'$project': {
//             'userId': '$userId', 'number': '$history.number'
//         }},
//         {'$group': {'_id': null, 'number': {'$sum': '$number'}}}
//     ]).exec(function(e, d) {
//         console.log(e, d);
//         if(e) {
//             res.status(500).end();
//         } else {
//             res.send({allRate: d[0].number});
//         }
//     });
    
// });

var server = app.listen(6002, function () {});




