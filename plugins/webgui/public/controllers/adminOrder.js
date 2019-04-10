const app = angular.module('app');

app
.controller('AdminOrderSettingController', ['$scope', '$state', '$http',
  ($scope, $state, $http, $filter) => {
    $scope.setTitle('订单设置');
    $scope.setMenuButton('arrow_back', function() {
      $state.go('admin.settings');
    });
    $http.get('/api/admin/order').then(success => {
      $scope.orders = success.data;
      $scope.groupOrders = [];
      $scope.orders.forEach(order => {
        if(!order.baseId) {
          $scope.groupOrders.push([order]);
        } else {
          $scope.groupOrders[$scope.groupOrders.length - 1].push(order);
        }
      });
    });
    $scope.editOrder = id => {
      $state.go('admin.editOrder', { id });
    };
    $scope.setFabButton(() => {
      $state.go('admin.newOrder');
    });
    $scope.orderColor = order => {
      if(order.baseId) {
        return {
          background: 'blue-50', 'border-color': 'blue-300',
        };
      }
      return {};
    };
  }
])
.controller('AdminNewOrderController', ['$scope', '$state', '$http', '$filter', 'setOrderServerDialog', 'setOrderGroupDialog',
  ($scope, $state, $http, $filter, setOrderServerDialog, setOrderGroupDialog) => {
    $scope.setTitle('新增订单');
    $scope.setMenuButton('arrow_back', 'admin.order');

    $scope.typeList = [
      { key: '周', value: 2 },
      { key: '月', value: 3 },
      { key: '天', value: 4 },
      { key: '小时', value: 5 },
    ];
    $scope.order = {
      orderType: 'normal',
      type: 2,
      cycle: 1,
      alipay: 0,
      paypal: 0,
      flow: 100000000,
      refTime: 0,
      autoRemove: 0,
      autoRemoveDelay: 0,
      autoRemoveDelayStr: '0',
      portRange: '0',
      multiServerFlow: 0,
      changeOrderType: 1,
      server: null,
      active: 1,
    };
    $http.get('/api/admin/server').then(success => {
      $scope.servers = success.data;
    });
    $http.get('/api/admin/order').then(success => {
      $scope.orders = success.data.filter(f => {
        return !f.baseId;
      });
      $scope.order.baseId = $scope.orders[0] ? $scope.orders[0].id : null;
    });
    $http.get('/api/admin/group').then(success => {
      $scope.groups = success.data;
      $scope.orderGroupObj = {};
      $scope.groups.forEach(group => {
        if(!group.order) {
          $scope.orderGroupObj[group.id] = { disabled: true, checked: true };
        } else if(group.order.includes($scope.order.id)) {
          $scope.orderGroupObj[group.id] = { disabled: false, checked: true };
        } else {
          $scope.orderGroupObj[group.id] = { disabled: false, checked: false };
        }
      });
    });
    
    $scope.order.flowStr = $filter('flowNum2Str')($scope.order.flow);
    $scope.order.refTimeStr = $filter('timeNum2Str')($scope.order.refTime);
    $scope.order.orderServer = !!$scope.order.server;
    $scope.orderServerObj = {};
    $scope.cancel = () => { $state.go('admin.order'); };
    $scope.confirm = () => {
      $scope.order.flow = $filter('flowStr2Num')($scope.order.flowStr);
      $scope.order.refTime = $filter('timeStr2Num')($scope.order.refTimeStr);
      $scope.order.autoRemoveDelay = $filter('timeStr2Num')($scope.order.autoRemoveDelayStr);
      const server = Object.keys($scope.orderServerObj)
      .map(m => {
        if($scope.orderServerObj[m]) {
          return +m;
        }
      })
      .filter(f => f);
      $scope.order.server = $scope.order.orderServer ? server : null;
      if($scope.order.orderType === 'normal') {
        $http.post('/api/admin/order', {
          baseId: 0,
          name: $scope.order.name,
          shortComment: $scope.order.shortComment,
          comment: $scope.order.comment,
          type: $scope.order.type,
          cycle: $scope.order.cycle,
          alipay: $scope.order.alipay,
          paypal: $scope.order.paypal,
          flow: $scope.order.flow,
          refTime: $scope.order.refTime,
          autoRemove: $scope.order.autoRemove,
          autoRemoveDelay: $scope.order.autoRemoveDelay,
          portRange: $scope.order.portRange,
          multiServerFlow: $scope.order.multiServerFlow,
          changeOrderType: $scope.order.changeOrderType,
          server: $scope.order.server,
          active: $scope.order.active,
          group: $scope.orderGroup,
        }).then(success => {
          $state.go('admin.order');
        });
      } else if($scope.order.orderType === 'flow') {
        $http.post('/api/admin/order', {
          baseId: +$scope.order.baseId,
          name: $scope.order.name,
          shortComment: $scope.order.shortComment,
          comment: $scope.order.comment,
          alipay: $scope.order.alipay,
          paypal: $scope.order.paypal,
          flow: $scope.order.flow,
          group: $scope.orderGroup,
        }).then(success => {
          $state.go('admin.order');
        });
      }
    };
    $scope.orderGroup = [];
    $scope.$watch('orderGroupObj', () => {
      $scope.orderGroup = [];
      for(const ogo in $scope.orderGroupObj) {
        if($scope.orderGroupObj[ogo].checked) {
          $scope.orderGroup.push(ogo);
        }
      }
    }, true);
    $scope.orderServer = [];
    $scope.$watch('orderServerObj', () => {
      $scope.orderServer = [];
      if($scope.order && $scope.order.orderServer) {
        for(const oso in $scope.orderServerObj) {
          if($scope.orderServerObj[oso]) {
            $scope.orderServer.push(oso);
          }
        }
      }
    }, true);
    $scope.$watch('order.orderServer', () => {
      $scope.orderServer = [];
      if($scope.order && $scope.order.orderServer) {
        for(const oso in $scope.orderServerObj) {
          if($scope.orderServerObj[oso]) {
            $scope.orderServer.push(oso);
          }
        }
      }
    }, true);
    $scope.setOrderGroup = () => {
      setOrderGroupDialog.show($scope.orderId, $scope.groups, $scope.orderGroupObj);
    };
    $scope.setOrderServer = () => {
      setOrderServerDialog.show($scope.order, $scope.servers, $scope.orderServerObj);
    };
  }
])
.controller('AdminEditOrderController', ['$scope', '$state', '$http', '$stateParams', 'confirmDialog', '$filter', '$q', 'setOrderGroupDialog', 'setOrderServerDialog', 'setCurrentAccountDialog',
  ($scope, $state, $http, $stateParams, confirmDialog, $filter, $q, setOrderGroupDialog, setOrderServerDialog, setCurrentAccountDialog) => {
    $scope.setTitle('编辑订单');
    $scope.setMenuButton('arrow_back', 'admin.order');
    $scope.changeCurrentAccount = {
      flow: false,
      server: false,
      autoRemove: false,
    };
    $scope.typeList = [
      {key: '周', value: 2},
      {key: '月', value: 3},
      {key: '天', value: 4},
      {key: '小时', value: 5},
    ];

    $scope.orderId = $stateParams.id;
    $scope.orderInfoLoaded = false;
    $q.all([
      $http.get('/api/admin/server'),
      $http.get(`/api/admin/order/${ $scope.orderId }`),
      $http.get('/api/admin/order'),
      $http.get('/api/admin/group'),
    ]).then(success => {
      $scope.orderInfoLoaded = true;
      $scope.servers = success[0].data;
      $scope.order = success[1].data;
      if($scope.order.server) {
        $scope.order.server = JSON.parse($scope.order.server);
      } 
      $scope.orders = success[2].data.filter(f => {
        return !f.baseId;
      });
      $scope.order.flowStr = $filter('flowNum2Str')($scope.order.flow);
      $scope.order.refTimeStr = $filter('timeNum2Str')($scope.order.refTime);
      $scope.order.autoRemoveDelayStr = $filter('timeNum2Str')($scope.order.autoRemoveDelay);
      $scope.order.orderServer = !!$scope.order.server;
      $scope.orderServerObj = {};
      if($scope.order.server) {
        $scope.servers.forEach(server => {
          if($scope.order.server.indexOf(server.id) >= 0) {
            $scope.orderServerObj[server.id] = true;
          } else {
            $scope.orderServerObj[server.id] = false;
          }
        });
      }
      $scope.groups = success[3].data;
      $scope.orderGroupObj = {};
      $scope.groups.forEach(group => {
        if(!group.order) {
          $scope.orderGroupObj[group.id] = { disabled: true, checked: true };
        } else if(group.order.includes($scope.order.id)) {
          $scope.orderGroupObj[group.id] = { disabled: false, checked: true };
        } else {
          $scope.orderGroupObj[group.id] = { disabled: false, checked: false };
        }
      });
    });
    $scope.orderServer = [];
    $scope.$watch('orderServerObj', () => {
      $scope.orderServer = [];
      if($scope.order && $scope.order.orderServer) {
        for(const oso in $scope.orderServerObj) {
          if($scope.orderServerObj[oso]) {
            $scope.orderServer.push(oso);
          }
        }
      }
    }, true);
    $scope.$watch('order.orderServer', () => {
      $scope.orderServer = [];
      if($scope.order && $scope.order.orderServer) {
        for(const oso in $scope.orderServerObj) {
          if($scope.orderServerObj[oso]) {
            $scope.orderServer.push(oso);
          }
        }
      }
    }, true);
    $scope.orderGroup = [];
    $scope.$watch('orderGroupObj', () => {
      $scope.orderGroup = [];
      for(const ogo in $scope.orderGroupObj) {
        if($scope.orderGroupObj[ogo].checked) {
          $scope.orderGroup.push(ogo);
        }
      }
    }, true);
    $scope.currentAccount = 0;
    $scope.$watch('changeCurrentAccount', () => {
      $scope.currentAccount = 0;
      for(const cca in $scope.changeCurrentAccount) {
        if($scope.changeCurrentAccount[cca]) {
          $scope.currentAccount++;
        }
      }
    }, true);
    $scope.cancel = () => { $state.go('admin.order'); };
    $scope.delete = () => {
      confirmDialog.show({
        text: '真的要删除此订单吗？',
        cancel: '取消',
        confirm: '删除',
        error: '删除订单失败',
        useFnErrorMessage: true,
        fn: function () {
          return $http.delete(`/api/admin/order/${ $scope.orderId }`).catch(err => {
            if(err.status === 403) {
              let errData = '删除订单失败';
              if(err.data === 'account with this order exists') { errData = '无法删除订单，请先删除订单对应的账号'; }
              if(err.data === 'giftcard with this order exists') { errData = '无法删除订单，请先删除订单对应的充值码'; }
              if(err.data === 'flowpack order exists') { errData = '无法删除订单，请先删除对应的流量包订单'; }
              return Promise.reject(errData);
            } else {
              return Promise.reject('网络异常，请稍后再试');
            }
          });
        },
      }).then(() => {
        $state.go('admin.order');
      });
    };
    $scope.confirm = () => {
      $scope.order.flow = $filter('flowStr2Num')($scope.order.flowStr);
      $scope.order.refTime = $filter('timeStr2Num')($scope.order.refTimeStr);
      $scope.order.autoRemoveDelay = $filter('timeStr2Num')($scope.order.autoRemoveDelayStr);
      const server = Object.keys($scope.orderServerObj)
      .map(m => {
        if($scope.orderServerObj[m]) {
          return +m;
        }
      })
      .filter(f => f);
      $scope.order.server = $scope.order.orderServer ? server : null;
      if(!$scope.order.baseId) {
        $http.put(`/api/admin/order/${ $scope.orderId }`, {
          baseId: 0,
          name: $scope.order.name,
          shortComment: $scope.order.shortComment,
          comment: $scope.order.comment,
          type: $scope.order.type,
          cycle: $scope.order.cycle,
          alipay: $scope.order.alipay,
          paypal: $scope.order.paypal,
          flow: $scope.order.flow,
          refTime: $scope.order.refTime,
          autoRemove: $scope.order.autoRemove,
          autoRemoveDelay: $scope.order.autoRemoveDelay,
          portRange: $scope.order.portRange,
          multiServerFlow: $scope.order.multiServerFlow,
          changeOrderType: $scope.order.changeOrderType,
          server: $scope.order.server,
          changeCurrentAccount: $scope.changeCurrentAccount,
          active: $scope.order.active,
          group: $scope.orderGroup,
        }).then(success => {
          $state.go('admin.order');
        });
      } else {
        $http.put(`/api/admin/order/${ $scope.orderId }`, {
          baseId: +$scope.order.baseId,
          name: $scope.order.name,
          shortComment: $scope.order.shortComment,
          comment: $scope.order.comment,
          type: $scope.order.type,
          cycle: $scope.order.cycle,
          alipay: $scope.order.alipay,
          paypal: $scope.order.paypal,
          flow: $scope.order.flow,
          refTime: $scope.order.refTime,
          autoRemove: $scope.order.autoRemove,
          autoRemoveDelay: $scope.order.autoRemoveDelay,
          portRange: $scope.order.portRange,
          multiServerFlow: $scope.order.multiServerFlow,
          changeOrderType: $scope.order.changeOrderType,
          server: $scope.order.server,
          changeCurrentAccount: $scope.changeCurrentAccount,
          group: $scope.orderGroup,
        }).then(success => {
          $state.go('admin.order');
        });
      }
    };
    $scope.setOrderGroup = () => {
      setOrderGroupDialog.show($scope.orderId, $scope.groups, $scope.orderGroupObj);
    };
    $scope.setOrderServer = () => {
      setOrderServerDialog.show($scope.order, $scope.servers, $scope.orderServerObj);
    };
    $scope.setCurrentAccount = () => {
      setCurrentAccountDialog.show($scope.changeCurrentAccount);
    };
  }
])
;
