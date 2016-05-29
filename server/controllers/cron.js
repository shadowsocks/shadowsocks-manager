var shadowsocks = require('./shadowsocks');
var mail = require('./mail');
var later = require('later');
later.date.localTime();

var text = 'every 2 mins';
var sched = later.parse.text(text);

var timer = later.setInterval(function() {
    shadowsocks.updateServerList();
    shadowsocks.checkAccount();
    mail.sendActiveMail();
}, sched);
shadowsocks.updateServerList();