const app = angular.module('app');
const cdn = window.cdn || '';

app.factory('setGroupNoticeDialog' , [ '$mdDialog', $mdDialog => {
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
    templateUrl: `${ cdn }/public/views/dialog/setGroupNotice.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', 'bind', '$mdMedia', function($scope, bind, $mdMedia) {
      $scope.publicInfo = bind;
      $scope.setDialogWidth = () => {
        if($mdMedia('xs')) {
          return { 'min-width': '85vw' };
        } else if($mdMedia('sm')) {
          return { 'min-width': '70vw' };
        }
        return { 'min-width': '405px' };
      };
    }],
    clickOutsideToClose: true,
  };
  const show = (group, notices) => {
    publicInfo.group = group;
    publicInfo.notices = notices;
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
