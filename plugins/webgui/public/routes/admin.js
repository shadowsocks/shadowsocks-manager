const app = require('../index').app;

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('admin', {
      url: '/admin',
      abstract: true,
      templateUrl: '/public/views/admin/admin.html',
    })
    .state('admin.index', {
      url: '/index',
      controller: 'AdminIndexController',
      templateUrl: '/public/views/admin/index.html',
    }).state('admin.server', {
      url: '/server',
      controller: 'AdminServerController',
      templateUrl: '/public/views/admin/server.html',
    });
  }])
;
