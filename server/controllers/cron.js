var shadowsocks = require('./shadowsocks');
var history = require('./history');
var mail = require('./mail');
var system = require('./system');
var later = require('later');
var async = require('async');
later.date.localTime();

var text0 = 'every 2 mins';
var sched0 = later.parse.text(text0);

var timer0 = later.setInterval(function() {
    shadowsocks.updateServerList();
    shadowsocks.checkAccount();
    mail.sendActiveMail();
    mail.sendResetPasswordMail();
    history.historyHour();
}, sched0);
shadowsocks.updateServerList();
history.historyHour();

var text1 = 'every 1 hours';
var sched1 = later.parse.text(text1);

var timer1 = later.setInterval(function() {
    system.sendCount();
}, sched1);