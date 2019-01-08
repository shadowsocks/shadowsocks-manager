const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('admin.user', {
      url: '/user',
      controller: 'AdminUserController',
      templateUrl: `${ cdn }/public/views/admin/user.html`,
    })
    .state('admin.userPage', {
      url: '/user/:userId',
      controller: 'AdminUserPageController',
      templateUrl: `${ cdn }/public/views/admin/userPage.html`,
    })
    .state('admin.adminPage', {
      url: '/admin/:userId',
      controller: 'AdminAdminPageController',
      templateUrl: `${ cdn }/public/views/admin/adminPage.html`,
    })
    .state('admin.addUser', {
      url: '/addUser',
      controller: 'AdminAddUserController',
      templateUrl: `${ cdn }/public/views/admin/addUser.html`,
    });
  }])
;
