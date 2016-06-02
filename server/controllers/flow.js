var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var HistoryOriginal = mongoose.model('HistoryOriginal');
var moment = require('moment');

exports.getFlowChartToday = function (req, res) {
    var server = req.body.server;
    var port = req.body.port;
    var today = moment().hour(0).minute(0).second(0).millisecond(0).toDate();
    var chart = [];
    for(var i = 0; i < 288; i++) {
        chart[i] = {
            time: moment(today).add(i * 5, 'minutes'),
            flow: 0
        };
    }
    HistoryOriginal.find({
        name: server,
        port: +port,
        time: {$gte: today}
    }).exec(function(err, data) {
        if(err) {return cb(err);}
        data.forEach(function(d, di) {
            chart.forEach(function(c, ci) {
                if(ci === 0) {return;}
                if(d.time >= chart[ci - 1].time && d.time < c.time) {
                    chart[ci - 1].flow += d.flow;
                }
            });
        });
        res.send(chart);
    });
};