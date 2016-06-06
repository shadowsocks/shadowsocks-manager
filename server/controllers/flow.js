var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var HistoryOriginal = mongoose.model('HistoryOriginal');
var HistoryHour = mongoose.model('HistoryHour');
var moment = require('moment');

exports.getFlowChart = function (req, res) {
    var server = req.body.server;
    var port = req.body.port;
    var type = req.body.type || 'hour';
    var page = req.body.page || 0;

    var startTime;
    var interval;
    var number;

    var table = HistoryOriginal;

    if(type === 'lastHour') {
        startTime = moment().second(0).millisecond(0).add(-1, 'hours').toDate();
        interval = 4 * 60;
        number = 15;
    }
    if(type === 'hour') {
        startTime = moment().add(-page, 'hour').minute(0).second(0).millisecond(0).toDate();
        interval = 5 * 60;
        number = 12;
    }
    if(type === 'day') {
        table = HistoryHour;
        startTime = moment().add(-page, 'day').hour(0).minute(0).second(0).millisecond(0).toDate();
        interval = 60 * 60;
        number = 24;
    }
    if(type === 'week') {
        table = HistoryHour;
        startTime = moment().add(-page * 7, 'day').day(0).hour(0).minute(0).second(0).millisecond(0).toDate();
        interval = 60 * 60 * 24;
        number = 7;
    }
    if(type === 'month') {
        startTime = moment().date(1).hour(0).minute(0).second(0).millisecond(0).toDate();
        interval = 60 * 60 * 24;
        number = 30;
    }
    getFlowChart(server, port, startTime, interval, number, table, function(err, data) {
        if(err) {return res.status(500).end();}
        return res.send(data);
    });
};

var getFlowChart = function(server, port, startTime, interval, number, table, cb) {
    var time = startTime;
    var chart = [];
    for(var i = 0; i < number; i++) {
        chart[i] = {
            time: moment(time).add(i * interval, 'seconds').toDate(),
            flow: 0
        };
    }
    var query = {
        name: server,
        time: {
            $gte: time,
            $lt: moment(time).add(number * interval, 'seconds').toDate(),
        }
    };
    if(port) {
        query.port = +port;
    }
    table.find(query).exec(function(err, data) {
        if(err) {return cb(err);}
        data.forEach(function(d, di) {
            chart.forEach(function(c, ci) {
                if(ci < chart.length - 1) {
                    if(d.time >= c.time && d.time < chart[ci + 1].time) {
                        chart[ci].flow += d.flow;
                    }
                } else {
                    if(d.time >= chart[chart.length - 1].time) {
                        chart[chart.length - 1].flow += d.flow;
                    }
                }
                
            });
        });
        cb(null, chart);
    });
};