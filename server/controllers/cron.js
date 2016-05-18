var shadowsocks = require('./shadowsocks');
var later = require('later');
later.date.localTime();

var text = 'every 2 mins';
var sched = later.parse.text(text);

var timer = later.setInterval(function() {
    shadowsocks.updateServerList();
    shadowsocks.checkAccount();
}, sched);
shadowsocks.updateServerList();