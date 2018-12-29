const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('changePasswordDialog', [ '$mdDialog', 'userApi', ($mdDialog, userApi) => {
  const publicInfo = {
    status: 'show',
  };
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const show = (accountId, password) => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.status = 'show';
    publicInfo.accountId = accountId;
    publicInfo.password = password;
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  const close = () => {
    return $mdDialog.hide()
    .then(success => {
      dialogPromise = null;
      return;
    }).catch(err => {
      dialogPromise = null;
      return;
    });
  };
  const changePassword = () => {
    if(!publicInfo.password) { return; }
    publicInfo.status = 'loading';
    userApi.changeShadowsocksPassword(publicInfo.accountId, publicInfo.password)
    .then(() => {
      publicInfo.status = 'success';
    })
    .catch(() => {
      publicInfo.status = 'error';
    });
  };
  publicInfo.close = close;
  publicInfo.changePassword = changePassword;
  const dialog = {
    templateUrl: `${ cdn }/public/views/dialog/changePassword.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', 'bind', ($scope, bind) => {
      $scope.publicInfo = bind;
    }],
    clickOutsideToClose: false,
  };
  return {
    show,
  };
}]);
