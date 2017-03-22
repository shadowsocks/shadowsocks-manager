const app = angular.module('app');

app.controller('AdminNoticeController', ['$scope', '$http', '$state', ($scope, $http, $state) => {
  $scope.setTitle('公告管理');
  $scope.setMenuButton('arrow_back', function() {
    $state.go('admin.settings');
  });
  $scope.setFabButton(() => {
    $state.go('admin.addNotice');
  });
  $http.get('/api/admin/notice').then(success => {
    $scope.notices = success.data;
  });
  $scope.editNotice = id => {
    $state.go('admin.editNotice', { noticeId: id });
  };
}])
.controller('AdminEditNoticeController', ['$scope', '$http', '$state', '$stateParams', 'markdownDialog', ($scope, $http, $state, $stateParams, markdownDialog) => {
  $scope.setTitle('编辑公告');
  $scope.setMenuButton('arrow_back', 'admin.notice');
  $http.get('/api/admin/notice/' + $stateParams.noticeId).then(success => {
    $scope.notice = success.data;
  });
  $scope.delete = () => {
    $http.delete('/api/admin/notice/' + $stateParams.noticeId).then(success => {
      $state.go('admin.notice');
    });
  };
  $scope.save = () => {
    $http.put('/api/admin/notice/' + $stateParams.noticeId, {
      title: $scope.notice.title,
      content: $scope.notice.content,
    }).then(success => {
      $state.go('admin.notice');
    });
  };
  $scope.preview = () => {
    markdownDialog.show($scope.notice.title, $scope.notice.content);
  };
}])
.controller('AdminNewNoticeController', ['$scope', '$http', '$state', 'markdownDialog', ($scope, $http, $state, markdownDialog) => {
  $scope.setTitle('新增公告');
  $scope.setMenuButton('arrow_back', 'admin.notice');
  $scope.cancel = () => {
    $state.go('admin.notice');
  };
  $scope.save = () => {
    $http.post('/api/admin/notice/', {
      title: $scope.notice.title,
      content: $scope.notice.content,
    }).then(success => {
      $state.go('admin.notice');
    });
  };
  $scope.preview = () => {
    markdownDialog.show($scope.notice.title, $scope.notice.content);
  };
}])
;