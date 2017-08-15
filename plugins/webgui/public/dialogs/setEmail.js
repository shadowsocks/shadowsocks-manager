const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('setEmailDialog', [ '$mdDialog', '$state', '$http', ($mdDialog, $state, $http) => {
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
  const set = (title, content) => {
    load();
    $http.post(``, {
      type: publicInfo.emailType,
      title,
      content,
    }).then(success => {
      hide();
    }).catch(() => {
      publicInfo.isLoading = false;
    });
  };
  publicInfo.set = set;
  const get = (title, content) => {
    load();
    $http.get(``,).then(success => {
      hide();
    }).catch(() => {
      publicInfo.isLoading = false;
    });
  };
  publicInfo.get = get;
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: `${ cdn }/public/views/dialog/setEmail.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdMedia', '$mdDialog', '$http', 'bind', function($scope, $mdMedia, $mdDialog, $http, bind) {
      $scope.publicInfo = bind;
      $scope.setDialogWidth = () => {
        if($mdMedia('xs') || $mdMedia('sm')) {
          return {};
        }
        return { 'min-width': '400px' };
      };
    }],
    fullscreen: true,
    clickOutsideToClose: false,
  };
  const load = () => {
    publicInfo.isLoading = true;
  };
  const show = emailType => {
    publicInfo.isLoading = false;
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.emailType = emailType;
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
  };
}]);