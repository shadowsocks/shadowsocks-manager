const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('home', {
      url: '/home',
      abstract: true,
      templateUrl: `${ cdn }/public/views/home/home.html`,
      resolve: {
        myConfig: ['$http', 'configManager', ($http, configManager) => {
          if(configManager.getConfig().version) { return; }
          return $http.get('/api/home/login').then(success => {
            configManager.setConfig(success.data);
          });
        }]
      },
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
    .state('home.telegramLogin', {
      url: '/login/telegram/:token',
      controller: 'HomeTelegramLoginController',
      templateUrl: `${ cdn }/public/views/home/telegramLogin.html`,
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
    })
    .state('home.refInput', {
      url: '/ref',
      controller: 'HomeRefInputController',
      templateUrl: `${ cdn }/public/views/home/refInput.html`,
    })
    .state('home.ref', {
      url: '/ref/:refId',
      controller: 'HomeRefController',
      templateUrl: `${ cdn }/public/views/home/ref.html`,
    })
    .state('home.social', {
      url: '/social',
      controller: 'HomeSocialLoginController',
      templateUrl: `${ cdn }/public/views/home/social.html`,
    })
    .state('home.google', {
      url: '/google',
      controller: 'HomeGoogleLoginController',
      templateUrl: `${ cdn }/public/views/home/google.html`,
    })
    .state('home.facebook', {
      url: '/facebook',
      controller: 'HomeFacebookLoginController',
      templateUrl: `${ cdn }/public/views/home/facebook.html`,
    })
    .state('home.github', {
      url: '/github',
      controller: 'HomeGithubLoginController',
      templateUrl: `${ cdn }/public/views/home/github.html`,
    })
    .state('home.twitter', {
      url: '/twitter',
      controller: 'HomeTwitterLoginController',
      templateUrl: `${ cdn }/public/views/home/twitter.html`,
    })
    ;
  }
]);

