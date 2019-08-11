const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.config(['$stateProvider', $stateProvider => {
  $stateProvider
    .state('user', {
      url: '/user',
      abstract: true,
      templateUrl: `${ cdn }/public/views/user/user.html`,
      resolve: {
        myConfig: ['$http', 'configManager', ($http, configManager) => {
          if(configManager.getConfig().version) { return; }
          return $http.get('/api/home/login').then(success => {
            configManager.setConfig(success.data);
          });
        }]
      },
    })
    .state('user.index', {
      url: '/index',
      controller: 'UserIndexController',
      templateUrl: `${ cdn }/public/views/user/index.html`,
    })
    .state('user.account', {
      url: '/account',
      controller: 'UserAccountController',
      templateUrl: `${ cdn }/public/views/user/account.html`,
    })
    .state('user.settings', {
      url: '/settings',
      controller: 'UserSettingsController',
      templateUrl: `${ cdn }/public/views/user/settings.html`,
    })
    .state('user.changePassword', {
      url: '/changePassword',
      controller: 'UserChangePasswordController',
      templateUrl: `${ cdn }/public/views/user/changePassword.html`,
    })
    .state('user.telegram', {
      url: '/telegram',
      controller: 'UserTelegramController',
      templateUrl: `${ cdn }/public/views/user/telegram.html`,
    })
    .state('user.ref', {
      url: '/ref',
      controller: 'UserRefController',
      templateUrl: `${ cdn }/public/views/user/ref.html`,
    })
    .state('user.order', {
      url: '/order',
      controller: 'UserOrderController',
      templateUrl: `${ cdn }/public/views/user/order.html`,
    })
    .state('user.macAddress', {
      url: '/macAddress',
      controller: 'UserMacAddressController',
      templateUrl: `${ cdn }/public/views/user/macAddress.html`,
    })
    .state('user.notice', {
      url: '/notice',
      controller: 'UserNoticeController',
      templateUrl: `${ cdn }/public/views/user/notice.html`,
    })
    ;
  }])
;
