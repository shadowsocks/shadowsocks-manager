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
    $http.put('/api/admin/setting/mail', {
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
  const get = () => {
    load();
    $http.get('/api/admin/setting/mail', {
      params: {
        type: publicInfo.emailType,
      }
    }).then(success => {
      publicInfo.title = success.data.title;
      publicInfo.content = success.data.content;
      publicInfo.isLoading = false;
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
    publicInfo.title = '';
    publicInfo.content = '';
    publicInfo.isLoading = false;
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.emailType = emailType;
    dialogPromise = $mdDialog.show(dialog);
    publicInfo.get();
    return dialogPromise;
  };
  return {
    show,
  };
}]);
