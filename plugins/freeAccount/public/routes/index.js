const app = require('../index').app;

app.config(['$urlRouterProvider', '$locationProvider',
  ($urlRouterProvider, $locationProvider) => {
    $locationProvider.html5Mode(true);
    $urlRouterProvider
      .when('', '/')
      .otherwise('/');
  }
]);

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('index', {
      url: '/',
      controller: 'IndexController',
      templateUrl: '/public/views/index.html',
    })
    .state('account', {
      url: '/{id:[0-9a-f]{32}}',
      controller: 'AccountController',
      templateUrl: '/public/views/account.html',
    })
    .state('about', {
      url: '/about',
      controller: 'AboutController',
      templateUrl: '/public/views/about.html',
    });
}]);
