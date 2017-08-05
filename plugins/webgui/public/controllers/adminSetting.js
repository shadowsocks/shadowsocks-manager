const app = angular.module('app');

app.controller('AdminSettingsController', ['$scope', '$http', '$timeout', '$state',
  ($scope, $http, $timeout, $state) => {
    $scope.setTitle('设置');
    $scope.toNotice = () => {
      $state.go('admin.notice');
    };
    $scope.toPayment = () => {
      $state.go('admin.paymentSetting');
    };
    $scope.toAccount = () => {
      $state.go('admin.accountSetting');
    };
    $scope.toBase = () => {
      $state.go('admin.baseSetting');
    };
    $scope.empty = () => {};
  }
]).controller('AdminPaymentSettingController', ['$scope', '$http', '$timeout', '$state',
  ($scope, $http, $timeout, $state) => {
    $scope.setTitle('支付设置');
    $scope.setMenuButton('arrow_back', 'admin.settings');
    $scope.time = [{
      id: 'hour',
      name: '小时',
    }, {
      id: 'day',
      name: '天',
    }, {
      id: 'week',
      name: '周',
    }, {
      id: 'month',
      name: '月',
    }, {
      id: 'season',
      name: '季',
    }, {
      id: 'year',
      name: '年',
    }];
    let lastSave = 0;
    let lastSavePromise = null;
    const saveTime = 3500;
    $scope.saveSetting = () => {
      if(Date.now() - lastSave <= saveTime) {
        lastSavePromise && $timeout.cancel(lastSavePromise);
      }
      const timeout = Date.now() - lastSave >= saveTime ? 0 : saveTime - Date.now() + lastSave;
      lastSave = Date.now();
      lastSavePromise = $timeout(() => {
        $http.put('/api/admin/setting/payment', {
          data: $scope.paymentData,
        });
      }, timeout);
    };
    $http.get('/api/admin/setting/payment').then(success => {
      $scope.paymentData = success.data;
      $scope.$watch('paymentData', () => {
        $scope.saveSetting();
      }, true);
    });
    
  }
]).controller('AdminAccountSettingController', ['$scope', '$http', '$timeout', '$state',
  ($scope, $http, $timeout, $state) => {
    $scope.setTitle('账号设置');
    $scope.setMenuButton('arrow_back', 'admin.settings');
    let lastSave = 0;
    let lastSavePromise = null;
    const saveTime = 3500;
    $scope.saveSetting = () => {
      if(Date.now() - lastSave <= saveTime) {
        lastSavePromise && $timeout.cancel(lastSavePromise);
      }
      const timeout = Date.now() - lastSave >= saveTime ? 0 : saveTime - Date.now() + lastSave;
      lastSave = Date.now();
      lastSavePromise = $timeout(() => {
        $http.put('/api/admin/setting/account', {
          data: $scope.accountData,
        });
      }, timeout);
    };
    $http.get('/api/admin/setting/account').then(success => {
      $scope.accountData = success.data;
      $scope.$watch('accountData', () => {
        $scope.saveSetting();
      }, true);
    });
  }
]).controller('AdminBaseSettingController', ['$scope', '$http', '$timeout', '$state',
  ($scope, $http, $timeout, $state) => {
    $scope.setTitle('基本设置');
    $scope.setMenuButton('arrow_back', 'admin.settings');
    let lastSave = 0;
    let lastSavePromise = null;
    const saveTime = 3500;
    $scope.saveSetting = () => {
      if(Date.now() - lastSave <= saveTime) {
        lastSavePromise && $timeout.cancel(lastSavePromise);
      }
      const timeout = Date.now() - lastSave >= saveTime ? 0 : saveTime - Date.now() + lastSave;
      lastSave = Date.now();
      lastSavePromise = $timeout(() => {
        $http.put('/api/admin/setting/base', {
          data: $scope.baseData,
        });
      }, timeout);
    };
    $http.get('/api/admin/setting/base').then(success => {
      $scope.baseData = success.data;
      $scope.$watch('baseData', () => {
        $scope.saveSetting();
      }, true);
    });
  }
]);