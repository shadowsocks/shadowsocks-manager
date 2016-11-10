var app = angular.module('app', ['ngMaterial', 'ui.router', 'ngMessages', 'ja.qr']);

app.config(
  ['$stateProvider', '$urlRouterProvider', '$locationProvider',
    function($stateProvider, $urlRouterProvider, $locationProvider) {
      $locationProvider.html5Mode(true);
      $urlRouterProvider
        .when('', '/')
        .otherwise('/');
      $stateProvider
        .state('index', {
          url: '/',
          controller: 'IndexController',
          templateUrl: '/public/views/index.html'
        })
        .state('account', {
          url: '/{id:[0-9a-f]{32}}',
          controller: 'AccountController',
          templateUrl: '/public/views/account.html'
        })
        .state('password', {
          url: '/password',
          controller: 'PasswordController',
          templateUrl: '/public/views/password.html'
        })
        .state('manager', {
          url: '/manager',
          controller: 'ManagerController',
          templateUrl: '/public/views/manager.html'
        })
        .state('about', {
          url: '/about',
          controller: 'AboutController',
          templateUrl: '/public/views/about.html'
        })
      ;
    }
  ]
);
