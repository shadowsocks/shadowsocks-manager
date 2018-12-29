const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('addMacAccountDialog' , [ '$q', '$mdDialog', '$http', ($q, $mdDialog, $http) => {
  const publicInfo = { mac: '' };
  publicInfo.isLoading = false;
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
    templateUrl: `${ cdn }/public/views/dialog/addMacAccount.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', 'bind', function($scope, $mdDialog, bind) {
      $scope.publicInfo = bind;
    }],
    clickOutsideToClose: true,
  };
  const show = () => {
    if(isDialogShow()) {
      publicInfo.isLoading = false;
      return alertDialogPromise;
    }
    alertDialogPromise = $mdDialog.show(dialog);
    return alertDialogPromise;
  };
  const loading = () => {
    publicInfo.isLoading = true;
    if(!isDialogShow()) {
      return show();
    }
    return $q.resolve();
  };
  const addMac = () => {
    $http.post('/api/user/account/mac', {
      mac: publicInfo.mac
    }).then(success => {
      close();
    }).catch(err => {
      close();
    });
  };
  publicInfo.addMac = addMac;
  return {
    show,
    close,
  };
}]);
