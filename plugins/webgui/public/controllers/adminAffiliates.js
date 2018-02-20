const app = angular.module('app');

app.controller('AdminAffiliatesController', ['$scope', '$http', '$state', 'alertDialog', 
  ($scope, $http, $state, alertDialog) => {
    $scope.setTitle('推荐注册');
    $scope.affiliatesLink = '正在获取...';
    $scope.affiliatesRecordsData = null;
    $scope.isLoading = true;
    $http.get('/api/admin/affiliates/records').then(success => {
      $scope.affiliatesRecordsData = success.data;
        $scope.isLoading = false;
    }).catch(err => {
        alertDialog.show('获取推荐记录失败', '确定');
        $scope.isLoading = false;
    });
  }
]);