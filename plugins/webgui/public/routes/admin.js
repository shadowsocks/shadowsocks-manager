const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

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
    .state('admin.mailSetting', {
      url: '/settings/mail',
      controller: 'AdminMailSettingController',
      templateUrl: `${ cdn }/public/views/admin/mailSetting.html`,
    });
  }
]);
