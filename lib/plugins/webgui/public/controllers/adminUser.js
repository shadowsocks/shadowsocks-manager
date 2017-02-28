const app = require('../index').app;

app.controller('AdminUserController', ['$scope', '$state', '$stateParams', 'adminApi',
  ($scope, $state, $stateParams, adminApi) => {
    $scope.setTitle('用户');
    $scope.setMenuSearchButton('search');
    adminApi.getUser().then(success => {
      $scope.usersOriginal = success;
      $scope.users = angular.copy($scope.usersOriginal);
    });
    const userFilter = () => {
      $scope.users = angular.copy($scope.usersOriginal.filter(f => {
        return f.username.indexOf($scope.menuSearch.text) >= 0;
      }));
    };
    $scope.toUser = (id) => {
      $state.go('admin.userPage', { userId: id });
    };
    $scope.$on('cancelSearch', () => {
      $scope.users = angular.copy($scope.usersOriginal);
    });
    $scope.$watch('menuSearch.text', () => {
      if(!$scope.menuSearch.input) {
        return;
      }
      if(!$scope.menuSearch.text) {
        $scope.users = angular.copy($scope.usersOriginal);
        return;
      }
      userFilter();
    });
  }
])
.controller('AdminUserPageController', ['$scope', '$state', '$stateParams', '$http', '$mdDialog', 'adminApi', 'orderDialog', 'confirmDialog',
  ($scope, $state, $stateParams, $http, $mdDialog, adminApi, orderDialog, confirmDialog) => {
    $scope.setTitle('用户信息');
    $scope.setMenuButton('arrow_back', function() {
      $state.go('admin.user');
    });
    const userId = $stateParams.userId;
    const getUserData = () => {
      adminApi.getUserData(userId).then(success => {
        $scope.user = success.user;
        $scope.account = success.account;
        $scope.orders = success.orders;
      });
    };
    getUserData();
    $scope.deleteUserAccount = (accountId) => {
      // $http.delete(`/api/admin/user/${ userId }/${ accountId }`).then(success => {
      //   getUserData();
      // });
      confirmDialog.show({
        text: '将此账号移除出该用户的列表？',
        cancel: '取消',
        confirm: '移除',
        error: '移除账号失败',
        fn: function () { return $http.delete(`/api/admin/user/${ userId }/${ accountId }`); },
      }).then(() => {
        getUserData();
      }).catch(() => {
        
      });
    };
    const openDialog = () => {
      $scope.dialog = $mdDialog.show({
        templateUrl: '/public/views/admin/pickAccount.html',
        parent: angular.element(document.body),
        clickOutsideToClose:true,
        preserveScope: true,
        scope: $scope,
      });
    };
    $scope.setFabButton(() => {
      openDialog();
    });
    $scope.confirmAccount = () => {
      $mdDialog.hide($scope.dialog);
      const promise = [];
      $scope.account.forEach(f => {
        if(f.isChecked) {
          promise.push($http.put(`/api/admin/user/${ userId }/${ f.id }`));
        }
      });
      Promise.all(promise).then(success => {
        getUserData();
      });
    };
    $scope.toAccountPage = port => {
      adminApi.getAccountId(port).then(id => {
        $state.go('admin.accountPage', { accountId: id });
      });
    };
    $scope.showOrderInfo = order => {
      orderDialog.show(order);
    };
  }
]);
