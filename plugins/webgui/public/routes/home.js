const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';
app.config(['$urlRouterProvider', '$locationProvider',
  ($urlRouterProvider, $locationProvider) => {
    $locationProvider.html5Mode(true);
    $urlRouterProvider
      .when('/', '/home/index')
      .otherwise('/home/index')
    ;
  }
]);

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('home', {
      url: '/home',
      abstract: true,
      templateUrl: `${ cdn }/public/views/home/home.html`,
    })
    .state('home.index', {
      url: '/index',
      controller: 'HomeIndexController',
      templateUrl: `${ cdn }/public/views/home/index.html`,
    })
    .state('home.login', {
      url: '/login',
      controller: 'HomeLoginController',
      templateUrl: `${ cdn }/public/views/home/login.html`,
    })
    .state('home.signup', {
      url: '/signup',
      controller: 'HomeSignupController',
      templateUrl: `${ cdn }/public/views/home/signup.html`,
    })
    .state('home.resetPassword', {
      url: '/password/reset/:token',
      controller: 'HomeResetPasswordController',
      templateUrl: `${ cdn }/public/views/home/resetPassword.html`,
    });
  }
]);

app.service('authInterceptor', ['$q', '$localStorage', function($q, $localStorage) {
  const service = this;
  service.responseError = function(response) {
    if (response.status == 401) {
      $localStorage.home = {};
      $localStorage.admin = {};
      $localStorage.user = {};
      window.location = '/';
    }
    return $q.reject(response);
  };
}]).config(['$httpProvider', '$compileProvider', ($httpProvider, $compileProvider) => {
  $httpProvider.interceptors.push('authInterceptor');
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|http|ss):/);
}])
;
