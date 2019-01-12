const app = angular.module('app');

app.config(['$urlRouterProvider', '$locationProvider',
  ($urlRouterProvider, $locationProvider) => {
    $locationProvider.html5Mode(true);
    $urlRouterProvider
      .when('/', '/home/index')
      .otherwise('/home/index')
    ;
  }
]);
