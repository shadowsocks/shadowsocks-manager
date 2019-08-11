angular.module('app', [
  'ngMaterial',
  'ui.router',
  'ngMessages',
  'ja.qr',
  'chart.js',
  'angularMoment',
  'ngWebSocket',
  'ngStorage',
  'angular-inview',
  'hc.marked',
  'pascalprecht.translate',
  'ngclipboard',
]);

const addMeta = (name, content) => {
  const meta = document.createElement('meta');
  meta.name = name;
  meta.content = content;
  document.getElementsByTagName('head')[0].appendChild(meta);
};

const window = require('window');
angular.element(() => {
  $.get(window.api + '/api/home/login').then(success => {
    window.ssmgrConfig = success;

    window.$crisp = [];
    window.CRISP_RUNTIME_CONFIG = {
      session_merge : true
    };
    window.CRISP_READY_TRIGGER = () => {
      const event = document.createEvent('Event');
      event.initEvent('crispReady', true, true);
      document.dispatchEvent(event);
    };
    window.CRISP_WEBSITE_ID = window.ssmgrConfig.crisp;

    require('./directives/focusMe');

    require('./services/preloadService.js');
    require('./services/adminService.js');
    require('./services/homeService.js');
    require('./services/userService.js');
    require('./services/configService.js');
    // require('./services/websocketService.js');

    require('./configs/index.js');
    require('./controllers/index.js');
    require('./dialogs/index.js');
    require('./filters/index.js');
    require('./translate/index.js');
    require('./routes/index.js');
    
    angular.bootstrap(document, ['app']);
  }).catch(err => {
    let time = 5000;
    if(err.status === 403) {
      time = 1500;
    } else {
      time += 500;
    }
    setTimeout(() => { location.reload(); }, time);
  });
});
