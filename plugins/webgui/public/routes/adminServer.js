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
      params: {
        type: 'Shadowsocks',
        name: null,
        comment: null,
        address: null,
        port: null,
        password: null,
        method: 'aes-256-cfb',
        scale: 1,
        shift: 0,
        key: null,
        net: null,
        wgPort: null,
      },
    })
    .state('admin.editServer', {
      url: '/server/:serverId/edit',
      controller: 'AdminEditServerController',
      templateUrl: `${ cdn }/public/views/admin/editServer.html`,
    });
  }])
;
