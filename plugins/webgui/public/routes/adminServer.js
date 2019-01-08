const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('admin.server', {
      url: '/server',
      controller: 'AdminServerController',
      templateUrl: `${ cdn }/public/views/admin/server.html`,
    })
    .state('admin.serverPage', {
      url: '/server/:serverId',
      controller: 'AdminServerPageController',
      templateUrl: `${ cdn }/public/views/admin/serverPage.html`,
    })
    .state('admin.addServer', {
      url: '/addServer',
      controller: 'AdminAddServerController',
      templateUrl: `${ cdn }/public/views/admin/addServer.html`,
    })
    .state('admin.editServer', {
      url: '/server/:serverId/edit',
      controller: 'AdminEditServerController',
      templateUrl: `${ cdn }/public/views/admin/editServer.html`,
    });
  }])
;
