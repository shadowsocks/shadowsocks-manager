const app = angular.module('app');

app.controller('AdminGroupSettingController', ['$scope', '$http', '$state',
($scope, $http, $state) => {
  $scope.setTitle('群组管理');
  $scope.setMenuButton('arrow_back', function() {
    $state.go('admin.settings');
  });
  $scope.setFabButton(() => {
    $state.go('admin.addGroup');
  });
  $http.get('/api/admin/group').then(success => {
    $scope.groups = success.data;
  });
  $scope.editGroup = id => { $state.go('admin.editGroup', { groupId: id }); };
}
]).controller('AdminAddGroupController', ['$scope', '$http', '$timeout', '$state', 'alertDialog',
($scope, $http, $timeout, $state, alertDialog) => {
  $scope.setTitle('新增群组');
  $scope.setMenuButton('arrow_back', 'admin.groupSetting');
  $scope.group = {};
  $http.get('/api/admin/order').then(success => {
    $scope.orders = success.data;
    $scope.groupOrder = !!$scope.group.order;
      $scope.groupOrderObj = {};
      if($scope.group.order) {
        $scope.orders.forEach(order => {
          if($scope.group.order.indexOf(order.id) >= 0) {
            $scope.groupOrderObj[order.id] = true;
          } else {
            $scope.groupOrderObj[order.id] = false;
          }
        });
      }
  });
  $scope.confirm = () => {
    alertDialog.loading();
    const order = Object.keys($scope.groupOrderObj)
    .map(m => {
      if($scope.groupOrderObj[m]) {
        return +m;
      }
    })
    .filter(f => f);
    $scope.group.order = $scope.groupOrder ? order : null;
    $http.post('/api/admin/group', {
      name: $scope.group.name,
      comment: $scope.group.comment,
      showNotice: $scope.group.showNotice,
      order: $scope.group.order,
      multiAccount: $scope.group.multiAccount,
    }, {
      timeout: 15000,
    }).then(success => {
      alertDialog.show('添加群组成功', '确定');
      $state.go('admin.groupSetting');
    }).catch(() => {
      alertDialog.show('添加群组失败', '确定');
    });
  };
  $scope.cancel = () => {
    $state.go('admin.groupSetting');
  };
}
]).controller('AdminEditGroupController', ['$scope', '$http', '$q', '$state', '$stateParams', 'alertDialog',
($scope, $http, $q, $state, $stateParams, alertDialog) => {
  $scope.setTitle('修改群组');
  $scope.setMenuButton('arrow_back', 'admin.groupSetting');
  $scope.groupId = +$stateParams.groupId;
  $scope.group = {};
  $q.all([
    $http.get(`/api/admin/group/${ $scope.groupId }`),
    $http.get('/api/admin/order'),
  ]).then(success => {
    $scope.group = success[0].data;
    $scope.orders = success[1].data;
    $scope.groupOrder = !!$scope.group.order;
    $scope.groupOrderObj = {};
    if($scope.group.order) {
      $scope.group.order = JSON.parse($scope.group.order);
      $scope.orders.forEach(order => {
        if($scope.group.order.indexOf(order.id) >= 0) {
          $scope.groupOrderObj[order.id] = true;
        } else {
          $scope.groupOrderObj[order.id] = false;
        }
      });
    }
  });
  $scope.confirm = () => {
    alertDialog.loading();
    const order = Object.keys($scope.groupOrderObj)
    .map(m => {
      if($scope.groupOrderObj[m]) {
        return +m;
      }
    })
    .filter(f => f);
    $scope.group.order = $scope.groupOrder ? order : null;
    $http.put(`/api/admin/group/${ $scope.groupId }`, {
      name: $scope.group.name,
      comment: $scope.group.comment,
      showNotice: $scope.group.showNotice,
      order: $scope.group.order,
      multiAccount: $scope.group.multiAccount,
    }, {
      timeout: 15000,
    }).then(success => {
      alertDialog.show('修改群组成功', '确定');
      $state.go('admin.groupSetting');
    }).catch(() => {
      alertDialog.show('修改群组失败', '确定');
    });
  };
  $scope.cancel = () => {
    $state.go('admin.groupSetting');
  };
  $scope.delete = () => {
    alertDialog.loading();
    $http.delete(`/api/admin/group/${ $scope.groupId }`, {
      timeout: 15000,
    }).then(success => {
      alertDialog.show('删除群组成功', '确定');
      $state.go('admin.groupSetting');
    }).catch(() => {
      alertDialog.show('删除群组失败', '确定');
    });
  };
}
]);
