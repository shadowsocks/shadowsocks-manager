const app = angular.module('app');
const cdn = window.cdn || '';

app.factory('setCurrentAccountDialog' , [ '$mdDialog', $mdDialog => {
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
    templateUrl: `${ cdn }/public/views/dialog/setCurrentAccount.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', 'bind', function($scope, bind) {
      $scope.publicInfo = bind;
    }],
    clickOutsideToClose: true,
  };
  const show = (changeCurrentAccount) => {
    publicInfo.changeCurrentAccount = changeCurrentAccount;
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
