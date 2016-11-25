const app = require('../index').app;

app
  .filter('flow1024', () => {
    const kb = 1000;
    const mb = 1000 * kb;
    const gb = 1000 * mb;
    const tb = 1000 * gb;
    return (input) => {
      if (input < kb) {
        return input + ' B';
      } else if (input < mb) {
        return (input / kb).toFixed(1) + ' KB';
      } else if (input < gb) {
        return (input / mb).toFixed(1) + ' MB';
      } else if (input < tb) {
        return (input / gb).toFixed(2) + ' GB';
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
