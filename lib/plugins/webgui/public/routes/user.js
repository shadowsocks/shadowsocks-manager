const app = angular.module('app');

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('user', {
      url: '/user',
      abstract: true,
      templateUrl: '/public/views/user/user.html',
    })
    .state('user.index', {
      url: '/index',
      controller: 'UserIndexController',
      templateUrl: '/public/views/user/index.html',
    })
    .state('user.account', {
      url: '/account',
      controller: 'UserAccountController',
      templateUrl: '/public/views/user/account.html',
    });
  }])
;
