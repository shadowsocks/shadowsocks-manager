const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';
app.config(['$sceProvider', $sceProvider => {
  $sceProvider.enabled(false);
}]);
app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('admin', {
      url: '/admin',
      abstract: true,
      templateUrl: `${ cdn }/public/views/admin/admin.html`,
    })
    .state('admin.index', {
      url: '/index',
      controller: 'AdminIndexController',
      templateUrl: `${ cdn }/public/views/admin/index.html`,
    })
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
    })
    .state('admin.user', {
      url: '/user',
      controller: 'AdminUserController',
      templateUrl: `${ cdn }/public/views/admin/user.html`,
    })
    .state('admin.addUser', {
      url: '/addUser',
      controller: 'AdminAddUserController',
      templateUrl: `${ cdn }/public/views/admin/addUser.html`,
    })
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
    })
    .state('admin.userPage', {
      url: '/user/:userId',
      controller: 'AdminUserPageController',
      templateUrl: `${ cdn }/public/views/admin/userPage.html`,
    })
    .state('admin.pay', {
      url: '/pay',
      controller: 'AdminPayController',
      templateUrl: `${ cdn }/public/views/admin/pay.html`,
    })
    .state('admin.settings', {
      url: '/settings',
      controller: 'AdminSettingsController',
      templateUrl: `${ cdn }/public/views/admin/settings.html`,
    })
    .state('admin.notice', {
      url: '/notice',
      controller: 'AdminNoticeController',
      templateUrl: `${ cdn }/public/views/admin/notice.html`,
    })
    .state('admin.editNotice', {
      url: '/notice/{noticeId:int}',
      controller: 'AdminEditNoticeController',
      templateUrl: `${ cdn }/public/views/admin/editNotice.html`,
    })
    .state('admin.addNotice', {
      url: '/notice/new',
      controller: 'AdminNewNoticeController',
      templateUrl: `${ cdn }/public/views/admin/newNotice.html`,
    })
    .state('admin.unfinished', {
      url: '/unfinished',
      templateUrl: `${ cdn }/public/views/admin/unfinished.html`,
    })
    .state('admin.paymentSetting', {
      url: '/settings/payment',
      controller: 'AdminPaymentSettingController',
      templateUrl: `${ cdn }/public/views/admin/paymentSetting.html`,
    })
    .state('admin.baseSetting', {
      url: '/settings/base',
      controller: 'AdminBaseSettingController',
      templateUrl: `${ cdn }/public/views/admin/baseSetting.html`,
    })
    .state('admin.accountSetting', {
      url: '/settings/account',
      controller: 'AdminAccountSettingController',
      templateUrl: `${ cdn }/public/views/admin/accountSetting.html`,
    })
    ;
  }])
;
const config = JSON.parse(window.ssmgrConfig);
app.config(['$mdThemingProvider', $mdThemingProvider => {
  const checkColor = color => {
    const colors = [
      'red',
      'pink',
      'purple',
      'deep-purple',
      'indigo',
      'blue',
      'light-blue',
      'cyan',
      'teal',
      'green',
      'light-green',
      'lime',
      'yellow',
      'amber',
      'orange',
      'deep-orange',
      'brown',
      'grey',
      'blue-grey',
    ];
    return colors.indexOf(color) >= 0;
  };
  checkColor(config.themePrimary) && $mdThemingProvider.theme('default').primaryPalette(config.themePrimary);
  checkColor(config.themeAccent) && $mdThemingProvider.theme('default').primaryPalette(config.themeAccent);
}]);