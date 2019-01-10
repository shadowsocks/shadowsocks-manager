const later = require('later');
later.date.localTime();

const minute = function(fn, time = 1) {
  const fnWithMainWorker = () => { if(isMainWorker()) { fn(); }; };
  later.setInterval(fnWithMainWorker, later.parse.text(`every ${ time } mins`));
};

const second = function(fn, time = 10) {
  const fnWithMainWorker = () => { if(isMainWorker()) { fn(); }; };
  later.setInterval(fnWithMainWorker, later.parse.text(`every ${ time } seconds`));
};

const cron = function(fn, cronString) {
  const fnWithMainWorker = () => { if(isMainWorker()) { fn(); }; };
  later.setInterval(fnWithMainWorker, later.parse.cron(cronString));
};

exports.minute = minute;
exports.second = second;
exports.cron = cron;
