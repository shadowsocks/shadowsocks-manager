const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('setGroupDialog' , [ '$mdDialog', $mdDialog => {
  const publicInfo = {};
  const hide = () => {
    return $mdDialog.hide()
    .then(success => {
      dialogPromise = null;
      return;
    }).catch(err => {
      dialogPromise = null;
      return;
    });
  };
  publicInfo.hide = hide;
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: `${ cdn }/public/views/dialog/setUserGroup.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$http', 'bind', function($scope, $http, bind) {
      $scope.publicInfo = bind;
      $scope.groups = [];
      $scope.publicInfo.isLoading = true;
      $http.get('/api/admin/group').then(success => {
        $scope.groups = success.data;
        $scope.publicInfo.isLoading = false;
      });
      $scope.publicInfo.setGroup = () => {
        $http.post(`/api/admin/group/${ $scope.publicInfo.groupId }/${ $scope.publicInfo.userId }`)
        .then(success => {
          $scope.publicInfo.hide();
        });
      };
    }],
    clickOutsideToClose: true,
  };
  const show = (userId, groupId) => {
    publicInfo.userId = userId;
    publicInfo.groupId = groupId;
    if(isDialogShow()) {
      return dialogPromise;
    }
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
    hide,
  };
}]);
