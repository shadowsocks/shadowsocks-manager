const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('app', {
      url: '/app',
      abstract: true,
      templateUrl: `${ cdn }/public/views/app/app.html`,
      resolve: {
        myConfig: ['$http', 'configManager', ($http, configManager) => {
          if(configManager.getConfig().version) { return; }
          return $http.get('/api/home/login').then(success => {
            configManager.setConfig(success.data);
          });
        }]
      },
    })
    .state('app.loading', {
      url: '/loading',
      controller: 'AppLoadingController',
      templateUrl: `${ cdn }/public/views/app/loading.html`,
    })
    .state('app.index', {
      url: '/index',
      controller: 'AppIndexController',
      templateUrl: `${ cdn }/public/views/app/index.html`,
    })
    .state('app.login', {
      url: '/login',
      controller: 'AppLoginController',
      templateUrl: `${ cdn }/public/views/app/login.html`,
    });
  }
]);

