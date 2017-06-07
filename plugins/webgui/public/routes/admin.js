const app = angular.module('app');

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
    })
    .state('admin.server', {
      url: '/server',
      controller: 'AdminServerController',
      templateUrl: '/public/views/admin/server.html',
    })
    .state('admin.serverPage', {
      url: '/server/:serverId',
      controller: 'AdminServerPageController',
      templateUrl: '/public/views/admin/serverPage.html',
    })
    .state('admin.addServer', {
      url: '/addServer',
      controller: 'AdminAddServerController',
      templateUrl: '/public/views/admin/addServer.html',
    })
    .state('admin.editServer', {
      url: '/server/:serverId/edit',
      controller: 'AdminEditServerController',
      templateUrl: '/public/views/admin/editServer.html',
    })
    .state('admin.user', {
      url: '/user',
      controller: 'AdminUserController',
      templateUrl: '/public/views/admin/user.html',
    })
    .state('admin.addUser', {
      url: '/addUser',
      controller: 'AdminAddUserController',
      templateUrl: '/public/views/admin/addUser.html',
    })
    .state('admin.account', {
      url: '/account',
      controller: 'AdminAccountController',
      templateUrl: '/public/views/admin/account.html',
    })
    .state('admin.accountPage', {
      url: '/account/:accountId',
      controller: 'AdminAccountPageController',
      templateUrl: '/public/views/admin/accountPage.html',
    })
    .state('admin.addAccount', {
      url: '/addAccount',
      controller: 'AdminAddAccountController',
      templateUrl: '/public/views/admin/addAccount.html',
    })
    .state('admin.editAccount', {
      url: '/account/:accountId/edit',
      controller: 'AdminEditAccountController',
      templateUrl: '/public/views/admin/editAccount.html',
    })
    .state('admin.userPage', {
      url: '/user/:userId',
      controller: 'AdminUserPageController',
      templateUrl: '/public/views/admin/userPage.html',
    })
    .state('admin.pay', {
      url: '/pay',
      controller: 'AdminPayController',
      templateUrl: '/public/views/admin/pay.html',
    })
    .state('admin.settings', {
      url: '/settings',
      controller: 'AdminSettingsController',
      templateUrl: '/public/views/admin/settings.html',
    })
    .state('admin.notice', {
      url: '/notice',
      controller: 'AdminNoticeController',
      templateUrl: '/public/views/admin/notice.html',
    })
    .state('admin.editNotice', {
      url: '/notice/{noticeId:int}',
      controller: 'AdminEditNoticeController',
      templateUrl: '/public/views/admin/editNotice.html',
    })
    .state('admin.addNotice', {
      url: '/notice/new',
      controller: 'AdminNewNoticeController',
      templateUrl: '/public/views/admin/newNotice.html',
    })
    .state('admin.unfinished', {
      url: '/unfinished',
      templateUrl: '/public/views/admin/unfinished.html',
    });
  }])
;
