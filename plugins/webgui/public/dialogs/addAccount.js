const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('addAccountDialog', [ '$mdDialog', '$state', '$http', ($mdDialog, $state, $http) => {
  const macAccount = JSON.parse(window.ssmgrConfig).macAccount;
  const publicInfo = {};
  publicInfo.status = 'choose';
  publicInfo.accountType = 'port';
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
    templateUrl: `${ cdn }/public/views/dialog/addAccount.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdMedia', '$mdDialog', '$http', '$localStorage', 'bind', function($scope, $mdMedia, $mdDialog, $http, $localStorage, bind) {
      $scope.publicInfo = bind;
      $scope.setDialogWidth = () => {
        if($mdMedia('xs') || $mdMedia('sm')) {
          return {};
        }
        return { 'min-width': '400px' };
      };
    }],
    fullscreen: true,
    clickOutsideToClose: true,
  };
  const getAccountPort = () => {
    publicInfo.status = 'port';
    publicInfo.isLoading = true;
    $http.get('/api/admin/user/account').then(success => {
      publicInfo.isLoading = false;
      publicInfo.account = success.data;
    });
  };
  const next = () => {
    if(publicInfo.accountType === 'port') {
      getAccountPort();
    }
  };
  publicInfo.next = next;
  const setPort = () => {
    const promises = [];
    publicInfo.account.forEach(f => {
      if(f.isChecked) {
        promises.push($http.put(`/api/admin/user/${ publicInfo.userId }/${ f.id }`));
      }
    });
    Promise.all(promises)
    .then(success => {
      hide();
    });
  };
  publicInfo.setPort = setPort;
  const show = userId => {
    publicInfo.userId = userId;
    publicInfo.isLoading = false;
    if(macAccount) {
      publicInfo.status = 'choose';
    } else {
      next();
    }
    if(isDialogShow()) {
      return dialogPromise;
    }
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
  };
}]);