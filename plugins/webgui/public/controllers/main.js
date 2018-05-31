const app = angular.module('app');

app.controller('MainController', ['$scope', '$localStorage', '$location', '$http', '$translate', 'languageDialog', '$state',
  ($scope, $localStorage, $location, $http, $translate, languageDialog, $state) => {
    $scope.setConfig = (key, value) => {
      if(angular.isObject(key)) {
        for(const k in key) {
          $scope.config[k] = key[k];
        }
      } else {
        $scope.config[key] = value;
      }
    };
    $scope.config = window.ssmgrConfig;
    $scope.config.title = window.title;
    $scope.config.skin = 'default';
    $scope.config.fullscreenSkin = false;
    $scope.setId = id => { $scope.id = id; };
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
    if(isSafari() && $location.url() === '/' && $localStorage.home.url !== '/home/index') {
      location.href = $localStorage.home.url || '/home/index';
    }
    const setFs = () => {
      if($scope.config.skin.substr(0, 3) === 'fs_' && $state.current.name === 'home.index') {
        $scope.config.fullscreenSkin = true;
      } else {
        $scope.config.fullscreenSkin = false;
      }
    };
    $scope.$on('$stateChangeSuccess', () => {
      $scope.currentState = $state.current.name;
      $localStorage.home.url = $location.url();
      setFs();
    });
    $scope.$watch('config.skin', () => {
      setFs();
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
