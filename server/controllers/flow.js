var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var HistoryOriginal = mongoose.model('HistoryOriginal');
var moment = require('moment');

exports.getFlowChart = function (req, res) {
    var server = req.body.server;
    var port = req.body.port;
    var startTime = moment().second(0).millisecond(0).add(-1, 'hours').toDate();
    var interval = 4 * 60;
    var number = 15;
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
    var query = {
        name: server,
        time: {$gte: time}
    };
    if(port) {
        query.port = +port;
    }
    HistoryOriginal.find(query).exec(function(err, data) {
        if(err) {return cb(err);}
        data.forEach(function(d, di) {
            chart.forEach(function(c, ci) {
                if(ci === 0) {return;}
                if(d.time >= chart[ci - 1].time && d.time < c.time) {
                    chart[ci - 1].flow += d.flow;
                }
                if(d.time >= chart[chart.length - 1]) {
                    chart[chart.length - 1].flow += d.flow;
                }
            });
        });
        cb(null, chart);
    });
};