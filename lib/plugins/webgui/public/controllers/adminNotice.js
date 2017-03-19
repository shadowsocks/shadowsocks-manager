const app = angular.module('app');

app.controller('AdminNoticeController', ['$scope', '$http', ($scope, $http) => {
  $scope.setTitle('公告管理');
  $scope.setMenuButton('arrow_back', 'admin.settings');
  $http.get('/api/admin/notice').then(success => {
    $scope.notices = success.data;
  });
  
}]);