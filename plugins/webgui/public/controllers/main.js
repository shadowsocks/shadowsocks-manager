const app = angular.module('app');

app.config(['$translateProvider',function ($translateProvider) {
  $translateProvider.translations('zh', {
  });
  $translateProvider.translations('en', {
    '首页':'HOME',
    '登录':'SIGN IN',
    '注册':'SIGN UP',
    '快速搭建':'Build fast',
    '易于配置':'Config easily',
    '官方标准':'Official API',
    '仅依赖Node.js，无需安装数据库（可选MySQL）' :'Just depend on Node.js and Sqlite or Mysql',
    '带有插件系统，仅需修改配置文件即可运行'      :'Based on Plugin, just run it after edit the config',
    '支持libev和python版本的标准manager API'    :'Support ss-libev and ss-python with manager API',
  });
  $translateProvider.preferredLanguage('zh');
}]);

app.controller('MainController', ['$scope', '$localStorage', '$location', '$http', '$translate', 
  ($scope, $localStorage, $location, $http, $translate) => {

    $scope.userState = ('zh en').split(' ');//.map((state) => { return state; });

    $scope.changeLanguage = function (key) {
      console.log(key);
      $translate.use(key);
    };

    $scope.version = window.ssmgrVersion;
    $scope.config = JSON.parse(window.ssmgrConfig);
    $localStorage.$default({
      admin: {},
      home: {},
      user: {},
    });
    $scope.mainLoading = true;
    $scope.setMainLoading = status => {
      $scope.mainLoading = status;
    };
    document.addEventListener('visibilitychange', () => {
      $scope.$broadcast('visibilitychange', document.visibilityState);
    });
    const isSafari = () => {
      const ua = navigator.userAgent;
      const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
      const webkit = !!ua.match(/WebKit/i);
      const standalone = !!window.navigator.standalone;
      const iOSSafari = iOS && webkit && !ua.match(/CriOS/i);
      return iOSSafari && standalone;
    };
    if(isSafari() && $location.url() === '/home/index' && $localStorage.home.url !== '/home/index') {
      location.href = $localStorage.home.url || '/';
    }
    $scope.$on('$stateChangeSuccess', () => {
      $localStorage.home.url = $location.url();
    });

    let pushSubscribe;
    $scope.sendPushSubscribe = () => {
      if(!pushSubscribe) { return; }
      $http.post('/api/push/client', { data: pushSubscribe });
    };
    const isWechatBrowser = () => /micromessenger/.test(navigator.userAgent.toLowerCase());
    if(!isWechatBrowser() && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/serviceworker.js').then(function() {
        return navigator.serviceWorker.ready;
      }).then(reg => {
        console.log('Service Worker is ready to go!', reg.scope);
        reg.pushManager.subscribe({
          userVisibleOnly: true
        }).then(subscribe => {
          pushSubscribe = subscribe;
          $scope.sendPushSubscribe();
        });
      }).catch(function(error) {
        console.log('Service Worker failed to boot', error);
      });
    }
  }
]);
