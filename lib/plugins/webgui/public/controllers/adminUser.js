const app = require('../index').app;

app.controller('AdminUserController', ['$scope', '$state', '$stateParams', '$http',
  ($scope, $state, $stateParams, $http) => {
    $scope.setTitle('用户');
    $http.get('/api/admin/user').then(success => {
      $scope.users = success.data;
    });
    $scope.toUser = (id) => {
      $state.go('admin.userPage', { userId: id });
    };
  }
])
.controller('AdminUserPageController', ['$scope', '$state', '$stateParams', '$http', '$mdDialog',
  ($scope, $state, $stateParams, $http, $mdDialog) => {
    $scope.setTitle('用户信息');
    $scope.setMenuButton('arrow_back', function() {
      $state.go('admin.user');
    });
    const userId = $stateParams.userId;
    const getUserData = () => {
      $http.get('/api/admin/user/' + $stateParams.userId).then(success => {
        $scope.user = success.data;
      });
      $http.get('/api/admin/user/account').then(success => {
        $scope.account = success.data;
      });
    };
    getUserData();
    $scope.deleteUserAccount = (accountId) => {
      $http.delete(`/api/admin/user/${ userId }/${ accountId }`).then(success => {
        getUserData();
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
  }
]);
