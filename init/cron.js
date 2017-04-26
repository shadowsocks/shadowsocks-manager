const later = require('later');
later.date.localTime();

const minute = function(fn, time = 1) {
  later.setInterval(fn, later.parse.text(`every ${ time } mins`));
};

exports.minute = minute;