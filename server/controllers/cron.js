var shadowsocks = require('./shadowsocks');
var history = require('./history');
var mail = require('./mail');
var later = require('later');
var async = require('async');
later.date.localTime();

var text = 'every 2 mins';
var sched = later.parse.text(text);

var timer = later.setInterval(function() {
    shadowsocks.updateServerList();
    shadowsocks.checkAccount();
    mail.sendActiveMail();
    mail.sendResetPasswordMail();
    history.historyHour();
}, sched);
shadowsocks.updateServerList();
history.historyHour();
