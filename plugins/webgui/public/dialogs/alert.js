const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('alertDialog' , [ '$q', '$mdDialog', ($q, $mdDialog) => {
  const publicInfo = {};
  publicInfo.isLoading = false;
  publicInfo.content = '';
  publicInfo.button = '';
  let alertDialogPromise = null;
  const isDialogShow = () => {
    if(alertDialogPromise && !alertDialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const close = () => {
    return $mdDialog.hide().then(success => {
      publicInfo.isLoading = false;
      alertDialogPromise = null;
      return;
    }).catch(err => {
      publicInfo.isLoading = false;
      alertDialogPromise = null;
      return;
    });
  };
  publicInfo.close = close;
  const dialog = {
    templateUrl: `${ cdn }/public/views/dialog/alert.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', 'bind', function($scope, $mdDialog, bind) {
      $scope.publicInfo = bind;
    }],
    clickOutsideToClose: false,
  };
  const show = (content, button) => {
    publicInfo.content = content;
    publicInfo.button = button;
    if(isDialogShow()) {
      publicInfo.isLoading = false;
      return alertDialogPromise;
    }
    alertDialogPromise = $mdDialog.show(dialog);
    return $q.resolve();
  };
  const loading = () => {
    publicInfo.isLoading = true;
    if(!isDialogShow()) {
      return show();
    }
    return $q.resolve();
  };
  return {
    show,
    loading,
    close,
  };
}]);
