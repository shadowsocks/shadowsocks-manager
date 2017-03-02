const app = require('../index').app;

app.controller('MainController', ['$scope', '$localStorage', '$location', '$http',
  ($scope, $localStorage, $location, $http) => {
    $scope.version = window.ssmgrVersion;
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
      location.href = $localStorage.home.url;
    }
    $scope.$on('$stateChangeSuccess', () => {
      $localStorage.home.url = $location.url();
    });

    let pushSubscribe;
    const isWechatBrowser = () => /micromessenger/.test(navigator.userAgent.toLowerCase());
    if(!isWechatBrowser() && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/serviceworker.js').then(function() {
        return navigator.serviceWorker.ready;
      }).then(reg => {
        console.log('Service Worker is ready to go!', reg);
        reg.pushManager.subscribe({
          userVisibleOnly: true
        }).then(subscribe => {
          pushSubscribe = subscribe;
          $http.post('/api/push/test', { data: subscribe });
        });
      }).catch(function(error) {
        console.log('Service Worker failed to boot', error);
      });
    }
    $scope.sendPushSubscribe = () => {
      $http.post('/api/push/test', { data: pushSubscribe });
    };
  }
]);
