const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('userSortDialog' , [ '$mdDialog', '$http', ($mdDialog, $http) => {
  const publicInfo = {};
  $http.get('/api/admin/group').then(success => {
    publicInfo.groups = success.data;
    publicInfo.groups.unshift({ id: -1, name: '所有组', comment: '' });
  });
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
    templateUrl: `${ cdn }/public/views/admin/userSortDialog.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', '$localStorage', 'bind', '$mdMedia', function($scope, $mdDialog, $localStorage, bind, $mdMedia) {
      $scope.publicInfo = bind;
      $scope.userSort = $localStorage.admin.userSortSettings;
      if(!$scope.userSort.type) {
        $scope.userSort.type = {};
      }
      $scope.setDialogWidth = () => {
        if($mdMedia('xs') || $mdMedia('sm')) {
          return {};
        }
        return { 'min-width': '350px' };
      };
    }],
    clickOutsideToClose: true,
  };
  const show = id => {
    publicInfo.id = id;
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
