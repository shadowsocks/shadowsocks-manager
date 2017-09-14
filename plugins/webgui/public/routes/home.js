const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

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
    .state('home.macLogin', {
      url: '/login/:mac',
      controller: 'HomeMacLoginController',
      templateUrl: `${ cdn }/public/views/home/macLogin.html`,
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

