const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
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
    .state('admin.paymentList', {
      url: '/settings/paymentList',
      controller: 'AdminPaymentListController',
      templateUrl: `${ cdn }/public/views/admin/paymentList.html`,
    })
    .state('admin.editPayment', {
      url: '/settings/editPayment/:paymentType',
      controller: 'AdminEditPaymentController',
      templateUrl: `${ cdn }/public/views/admin/editPayment.html`,
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
    })
    .state('admin.passwordSetting', {
      url: '/settings/password',
      controller: 'AdminPasswordSettingController',
      templateUrl: `${ cdn }/public/views/admin/changePassword.html`,
    })
    .state('admin.telegramSetting', {
      url: '/settings/telegram',
      controller: 'AdminTelegramSettingController',
      templateUrl: `${ cdn }/public/views/admin/telegramSetting.html`,
    })
    .state('admin.listGiftCardBatch', {
      url: '/settings/giftcard',
      controller: 'AdminGiftCardController',
      templateUrl: `${ cdn }/public/views/admin/giftcardBatchList.html`
    })
    .state('admin.giftcardBatchDetails', {
      url: '/settings/giftcard/batch/:batchNumber',
      controller: 'AdminGiftCardBatchDetailsController',
      templateUrl: `${ cdn }/public/views/admin/giftcardBatchDetails.html`
    })
    .state('admin.groupSetting', {
      url: '/settings/group',
      controller: 'AdminGroupSettingController',
      templateUrl: `${ cdn }/public/views/admin/groupList.html`
    })
    .state('admin.addGroup', {
      url: '/settings/addGroup',
      controller: 'AdminAddGroupController',
      templateUrl: `${ cdn }/public/views/admin/addGroup.html`
    })
    .state('admin.editGroup', {
      url: '/settings/editGroup/:groupId',
      controller: 'AdminEditGroupController',
      templateUrl: `${ cdn }/public/views/admin/editGroup.html`
    })
    .state('admin.refSetting', {
      url: '/settings/ref',
      controller: 'AdminRefSettingController',
      templateUrl: `${ cdn }/public/views/admin/refSetting.html`
    })
    .state('admin.refCodeList', {
      url: '/settings/refCodeList',
      controller: 'AdminRefCodeListController',
      templateUrl: `${ cdn }/public/views/admin/refCodeList.html`
    })
    .state('admin.editRefCode', {
      url: '/settings/refCode/:id',
      controller: 'AdminEditRefCodeController',
      templateUrl: `${ cdn }/public/views/admin/editRefCode.html`
    })
    .state('admin.refUserList', {
      url: '/settings/refUserList',
      controller: 'AdminRefUserListController',
      templateUrl: `${ cdn }/public/views/admin/refUserList.html`
    })
    .state('admin.myRefCode', {
      url: '/settings/myRefCode',
      controller: 'AdminMyRefCodeController',
      templateUrl: `${ cdn }/public/views/admin/myRefCode.html`
    })
    .state('admin.addRefUser', {
      url: '/settings/addRefUser',
      controller: 'AdminAddRefUserController',
      templateUrl: `${ cdn }/public/views/admin/addRefUser.html`
    })

    .state('admin.order', {
      url: '/settings/order',
      controller: 'AdminOrderSettingController',
      templateUrl: `${ cdn }/public/views/admin/orderSetting.html`
    })
    .state('admin.newOrder', {
      url: '/settings/newOrder',
      controller: 'AdminNewOrderController',
      templateUrl: `${ cdn }/public/views/admin/newOrder.html`
    })
    .state('admin.editOrder', {
      url: '/settings/editOrder/:id',
      controller: 'AdminEditOrderController',
      templateUrl: `${ cdn }/public/views/admin/editOrder.html`
    })
    ;
  }
]);
