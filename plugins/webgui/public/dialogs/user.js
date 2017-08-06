const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('userSortDialog' , [ '$mdDialog', ($mdDialog) => {
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
    templateUrl: `${ cdn }/public/views/admin/userSortDialog.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', '$localStorage', 'bind', function($scope, $mdDialog, $localStorage, bind) {
      $scope.publicInfo = bind;
      $scope.userSort = $localStorage.admin.userSortSettings;
    }],
    clickOutsideToClose: true,
  };
  const show = () => {
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