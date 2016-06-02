var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var HistoryOriginal = mongoose.model('HistoryOriginal');
var moment = require('moment');

exports.getFlowChartToday = function (req, res) {
    var server = req.body.server;
    var port = req.body.port;
    var startTime = moment().second(0).millisecond(0).add(-1, 'hours').toDate();
    var interval = 4 * 60;
    var number = 15;
    // var chart = [];
    // for(var i = 0; i < 24; i++) {
    //     chart[i] = {
    //         time: moment(today).add(i * 60, 'minutes'),
    //         flow: 0
    //     };
    // }
    // HistoryOriginal.find({
    //     name: server,
    //     port: +port,
    //     time: {$gte: today}
    // }).exec(function(err, data) {
    //     if(err) {return cb(err);}
    //     data.forEach(function(d, di) {
    //         chart.forEach(function(c, ci) {
    //             if(ci === 0) {return;}
    //             if(d.time >= chart[ci - 1].time && d.time < c.time) {
    //                 chart[ci - 1].flow += d.flow;
    //             }
    //         });
    //     });
    //     res.send(chart);
    // });
    getFlowChart(server, port, startTime, interval, number, function(err, data) {
        if(err) {return res.status(500).end();}
        return res.send(data);
    });
};

var getFlowChart = function(server, port, startTime, interval, number, cb) {
    var time = startTime;
    var chart = [];
    for(var i = 0; i < number; i++) {
        chart[i] = {
            time: moment(time).add(i * interval, 'seconds'),
            flow: 0
        };
    }
    HistoryOriginal.find({
        name: server,
        port: +port,
        time: {$gte: time}
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
        cb(null, chart);
    });
};