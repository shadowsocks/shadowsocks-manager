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
.controller('AdminEditNoticeController', ['$scope', '$http', '$state', '$stateParams', 'markdownDialog', 'setNoticeGroupDialog', ($scope, $http, $state, $stateParams, markdownDialog, setNoticeGroupDialog) => {
  $scope.setTitle('编辑公告');
  $scope.setMenuButton('arrow_back', 'admin.notice');
  $http.get('/api/admin/notice/' + $stateParams.noticeId).then(success => {
    $scope.notice = success.data;
    $scope.notice.groupObj = {};
    if($scope.notice.group) {
      $scope.notice.groups.forEach(groupId => {
        $scope.notice.groupObj[groupId] = true;
      });
    }
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
      group: $scope.notice.group,
      autopop: $scope.notice.autopop,
      groups: $scope.notice.groups,
    }).then(success => {
      $state.go('admin.notice');
    });
  };
  $scope.preview = () => {
    markdownDialog.show($scope.notice.title, $scope.notice.content);
  };
  $http.get('/api/admin/group').then(success => {
    $scope.groups = success.data;
    // $scope.groups.unshift({ id: -1, name: '所有组', comment: '所有组' });
  });
  $scope.setNoticeGroup = () => {
    setNoticeGroupDialog.show($scope.notice, $scope.groups);
  };
  $scope.$watch('notice.groupObj', () => {
    if($scope.notice && $scope.notice.group) {
      $scope.notice.groups = [];
      for(const go in $scope.notice.groupObj) {
        if($scope.notice.groupObj[go]) {
          $scope.notice.groups.push(+go);
        }
      }
    }
  }, true);
}])
.controller('AdminNewNoticeController', ['$scope', '$http', '$state', 'markdownDialog', 'setNoticeGroupDialog', ($scope, $http, $state, markdownDialog, setNoticeGroupDialog) => {
  $scope.setTitle('新增公告');
  $scope.notice = {
    group: 0,
    groupObj: {},
  };
  $scope.setMenuButton('arrow_back', 'admin.notice');
  $scope.cancel = () => {
    $state.go('admin.notice');
  };
  $scope.save = () => {
    $http.post('/api/admin/notice/', {
      title: $scope.notice.title,
      content: $scope.notice.content,
      group: $scope.notice.group,
      groups: $scope.notice.groups,
      autopop: $scope.notice.autopop,
    }).then(success => {
      $state.go('admin.notice');
    });
  };
  $scope.preview = () => {
    markdownDialog.show($scope.notice.title, $scope.notice.content);
  };
  $http.get('/api/admin/group').then(success => {
    $scope.groups = success.data;
    // $scope.groups.unshift({ id: -1, name: '所有组', comment: '所有组' });
  });
  $scope.setNoticeGroup = () => {
    setNoticeGroupDialog.show($scope.notice, $scope.groups);
  };
  $scope.$watch('notice.groupObj', () => {
    if($scope.notice && $scope.notice.group) {
      $scope.notice.groups = [];
      for(const go in $scope.notice.groupObj) {
        if($scope.notice.groupObj[go]) {
          $scope.notice.groups.push(+go);
        }
      }
    }
  }, true);
}])
;
