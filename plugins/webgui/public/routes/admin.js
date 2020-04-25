const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('admin', {
      url: '/admin',
      abstract: true,
      templateUrl: `${ cdn }/public/views/admin/admin.html`,
      resolve: {
        myConfig: ['$http', 'configManager', ($http, configManager) => {
          if(configManager.getConfig().version) { return; }
          return $http.get('/api/home/login').then(success => {
            configManager.setConfig(success.data);
          });
        }]
      },
    })
    .state('admin.index', {
      url: '/index',
      controller: 'AdminIndexController',
      templateUrl: `${ cdn }/public/views/admin/index.html`,
    })
    .state('admin.pay', {
      url: '/pay',
      controller: 'AdminPayController',
      templateUrl: `${ cdn }/public/views/admin/pay.html`,
      params: {
        myPayType: null,
      },
    })
    .state('admin.recentSignup', {
      url: '/recentSignup',
      controller: 'AdminRecentSignupController',
      templateUrl: `${ cdn }/public/views/admin/recentSignup.html`,
    })
    .state('admin.recentLogin', {
      url: '/recentLogin',
      controller: 'AdminRecentLoginController',
      templateUrl: `${ cdn }/public/views/admin/recentLogin.html`,
    })
    .state('admin.topFlow', {
      url: '/topFlow',
      controller: 'AdminTopFlowController',
      templateUrl: `${ cdn }/public/views/admin/topFlow.html`,
    })
    .state('admin.unfinished', {
      url: '/unfinished',
      templateUrl: `${ cdn }/public/views/admin/unfinished.html`,
    });
  }
]);
