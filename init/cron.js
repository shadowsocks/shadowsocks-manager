const later = require('later');
later.date.localTime();
const sched0 = later.parse.text('every 1 mins');

const everyMinute = function(fn) {
  later.setInterval(fn, sched0);
};

exports.everyMinute = everyMinute;