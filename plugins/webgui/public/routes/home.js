const app = require('../index').app;

app.config(['$urlRouterProvider', '$locationProvider',
  ($urlRouterProvider, $locationProvider) => {
    $locationProvider.html5Mode(true);
    $urlRouterProvider
      .when('/', '/home/login')
      .otherwise('/home/login');
  }
]);

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('home', {
      url: '/home',
      // controller: 'HomeController',
      abstract: true,
      templateUrl: '/public/views/home.html',
    })
    .state('home.login', {
      url: '/login',
      controller: 'LoginController',
      templateUrl: '/public/views/login.html',
    });
  }
]);
