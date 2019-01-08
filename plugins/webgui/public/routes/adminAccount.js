const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('admin.account', {
      url: '/account',
      controller: 'AdminAccountController',
      templateUrl: `${ cdn }/public/views/admin/account.html`,
    })
    .state('admin.accountPage', {
      url: '/account/:accountId',
      controller: 'AdminAccountPageController',
      templateUrl: `${ cdn }/public/views/admin/accountPage.html`,
    })
    .state('admin.addAccount', {
      url: '/addAccount',
      controller: 'AdminAddAccountController',
      templateUrl: `${ cdn }/public/views/admin/addAccount.html`,
    })
    .state('admin.editAccount', {
      url: '/account/:accountId/edit',
      controller: 'AdminEditAccountController',
      templateUrl: `${ cdn }/public/views/admin/editAccount.html`,
    });
  }])
;
