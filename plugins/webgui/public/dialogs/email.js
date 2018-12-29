const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('emailDialog', [ '$mdDialog', '$state', '$http', ($mdDialog, $state, $http) => {
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
  const send = (title, content) => {
    load();
    $http.post(`/api/admin/user/${ publicInfo.userId }/sendEmail`, {
      title,
      content,
    }).then(success => {
      hide();
    }).catch(() => {
      publicInfo.isLoading = false;
    });
  };
  publicInfo.send = send;
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: `${ cdn }/public/views/dialog/email.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdMedia', '$mdDialog', '$http', '$localStorage', 'bind', function($scope, $mdMedia, $mdDialog, $http, $localStorage, bind) {
      $scope.publicInfo = bind;
      if(!$localStorage.admin.email) {
        $localStorage.admin.email = {
          title: '', content: '',
        };
      }
      $scope.publicInfo.email = $localStorage.admin.email;
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
  const show = userId => {
    publicInfo.isLoading = false;
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.userId = userId;
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
  };
}]);
