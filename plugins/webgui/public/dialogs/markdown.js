const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('markdownDialog', [ '$mdDialog', ($mdDialog) => {
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
    templateUrl: `${ cdn }/public/views/admin/previewNotice.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdMedia', '$mdDialog', 'bind', function($scope, $mdMedia, $mdDialog, bind) {
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
  const show = (title, markdown) => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.title = title;
    publicInfo.markdown = markdown;
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
  };
}]);
