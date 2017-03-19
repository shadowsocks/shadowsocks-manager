const app = angular.module('app');

app.controller('AdminNoticeController', ['$scope', '$http', '$state', ($scope, $http, $state) => {
  $scope.setTitle('公告管理');
  $scope.setMenuButton('arrow_back', 'admin.settings');
  $http.get('/api/admin/notice').then(success => {
    $scope.notices = success.data;
  });
  $scope.editNotice = id => {
    $state.go('admin.editNotice', { noticeId: id });
  };
}])
.controller('AdminEditNoticeController', ['$scope', '$http', '$stateParams', ($scope, $http, $stateParams) => {
  $scope.setTitle('编辑公告');
  $scope.setMenuButton('arrow_back', 'admin.notice');
  $http.get('/api/admin/notice/' + $stateParams.noticeId).then(success => {
    $scope.notice = success.data;
  });
}])
;