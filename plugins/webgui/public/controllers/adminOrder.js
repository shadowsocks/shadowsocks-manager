const app = angular.module('app');

app
.controller('AdminOrderSettingController', ['$scope', '$state', '$http',
  ($scope, $state, $http) => {
    $scope.setTitle('订单设置');
    $scope.setMenuButton('arrow_back', 'admin.settings');

    $http.get('/api/admin/order').then(success => {
      $scope.orders = success.data;
    });
    $scope.setFabButton(() => {
      $state.go('admin.newOrder');
    });
  }
])
.controller('AdminNewOrderController', ['$scope', '$state', '$http',
  ($scope, $state, $http) => {
    $scope.setTitle('新增订单');
    $scope.setMenuButton('arrow_back', 'admin.order');

    $scope.order = {};
    $scope.cancel = () => { $state.go('admin.order'); };
    $scope.confirm = () => {
      $http.post('/api/admin/order', $scope.order).then(success => {
        $state.go('admin.order');
      });
    };
  }
])
.controller('AdminEditOrderController', ['$scope',
  ($scope) => {
    $scope.setTitle('编辑订单');
    $scope.setMenuButton('arrow_back', 'admin.settings');
  }
])
;