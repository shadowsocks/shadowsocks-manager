const app = angular.module('app');

app.controller('MainController', ['$scope', '$localStorage', '$location', '$http', '$translate', 'languageDialog', '$state',
  ($scope, $localStorage, $location, $http, $translate, languageDialog, $state) => {
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
      $scope.currentState = $state.current.name;
      $localStorage.home.url = $location.url();
    });

    const isWechatBrowser = () => /micromessenger/.test(navigator.userAgent.toLowerCase());
    if(!isWechatBrowser() && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/serviceworker.js').then(function() {
        return navigator.serviceWorker.ready;
      }).then(reg => {
        console.log('Service Worker is ready to go!', reg.scope);
      }).catch(function(error) {
        console.log('Service Worker failed to boot', error);
      });
    }
    $scope.chooseLanguage = () => {
      languageDialog.show();
    };
    $translate.use($localStorage.language || navigator.language || 'zh-CN');
  }
]);
