const app = require('../index').app;

app.config(['$urlRouterProvider', '$locationProvider',
  ($urlRouterProvider, $locationProvider) => {
    $locationProvider.html5Mode(true);
    $urlRouterProvider
      .when('', '/')
      .otherwise('/');
  }
]);
