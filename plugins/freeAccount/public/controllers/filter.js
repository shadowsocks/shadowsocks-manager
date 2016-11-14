const app = require('../index').app;

app
  .filter('flow1024', () => {
    return (input) => {
      if (input < 1000) {
        return input + ' B';
      } else if (input < 1000000) {
        return (input / 1000).toFixed(1) + ' KB';
      } else if (input < 1000000000) {
        return (input / 1000000).toFixed(1) + ' MB';
      } else if (input < 1000000000000) {
        return (input / 1000000000).toFixed(2) + ' GB';
      } else {
        return input;
      }
    };
  }).filter('relativeTime', function() {
    function relativeTime(input) {
      let ret = '';
      let retTail = '';

      let time = (+new Date()) - (new Date(input));
      if (time < 0) {
        time = -time;
      } else {
        retTail = '前';
      }

      const day = Math.trunc(time / (24 * 3600 * 1000));
      const hour = Math.trunc(time % (24 * 3600 * 1000) / (3600 * 1000));
      const minute = Math.trunc(time % (24 * 3600 * 1000) % (3600 * 1000) / (60 * 1000));
      if (day) { ret += day + '天'; }
      if (day || hour) { ret += hour + '小时'; }
      if (!day && (hour || minute)) { ret += minute + '分钟'; }
      if (time < (60 * 1000)) { ret = '几秒'; }

      return ret + retTail;
    };
    relativeTime.$stateful = true;
    return relativeTime;
  });
