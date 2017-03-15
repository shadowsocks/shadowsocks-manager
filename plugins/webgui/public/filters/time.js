const app = angular.module('app');

app.filter('timeago', function() {
  Math.trunc = Math.trunc || function (value) {
    return value < 0 ? Math.ceil(value) : Math.floor(value);
  };
  const timeago = function(input) {
    let ret = '';
    let retTail = '';
    let time = Date.now() - (new Date(input));
    if (time < 0) {
      time = -time;
    } else {
      retTail = '前';
    }
    const day = Math.trunc(time / (24 * 3600 * 1000));
    const hour = Math.trunc(time % (24 * 3600 * 1000) / (3600 * 1000));
    const minute = Math.trunc(time % (24 * 3600 * 1000) % (3600 * 1000) / (60 * 1000));
    if (day) {
      ret += day + '天';
    }
    if (day || hour) {
      ret += hour + '小时';
    }
    if (!day && (hour || minute)) {
      ret += minute + '分钟';
    }
    if (time < (60 * 1000)) {
      ret = '几秒';
    }
    return ret + retTail;
  };
  timeago.$stateful = true;
  return timeago;
});

app.filter('timeagoshort', function() {
  Math.trunc = Math.trunc || function (value) {
    return value < 0 ? Math.ceil(value) : Math.floor(value);
  };
  return function(input) {

    let ret = '';
    let retTail = '';

    let time = Date.now() - (new Date(input));
    if (time < 0) {
      time = -time;
    } else {
      retTail = '前';
    }

    const day = Math.trunc(time / (24 * 3600 * 1000));
    const hour = Math.trunc(time % (24 * 3600 * 1000) / (3600 * 1000));
    const minute = Math.trunc(time % (24 * 3600 * 1000) % (3600 * 1000) / (60 * 1000));
    if (day) {
      ret += day + '天';
    } else if (hour) {
      ret += hour + '小时';
    } else if (minute) {
      ret += minute + '分钟';
    } else if (time < (60 * 1000)) {
      ret = '几秒';
    }
    return ret + retTail;
  };
});
