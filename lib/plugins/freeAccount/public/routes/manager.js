const app = require('../index').app;

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('password', {
      url: '/password',
      controller: 'PasswordController',
      templateUrl: '/public/views/password.html',
    })
    .state('manager', {
      url: '/manager',
      controller: 'ManagerController',
      templateUrl: '/public/views/manager.html',
    })
    .state('user', {
      url: '/user',
      controller: 'UserController',
      templateUrl: '/public/views/user.html',
    });
}]);
