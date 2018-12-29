const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('banDialog', [ '$mdDialog', ($mdDialog) => {
  const publicInfo = {
    banTime: 30,
  };
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
    templateUrl: `${ cdn }/public/views/dialog/ban.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$state', '$http', '$mdDialog', '$mdMedia', '$q', 'bind', '$filter', function($scope, $state, $http, $mdDialog, $mdMedia, $q, bind, $filter) {
      $scope.publicInfo = bind;
      $http.get(`/api/admin/account/${ $scope.publicInfo.serverId }/${ $scope.publicInfo.accountId }/ban`).then(success => {
        $scope.publicInfo.releaseTime = success.data.banTime;
      });
      $scope.publicInfo.ban = () => {
        $http.post(`/api/admin/account/${ $scope.publicInfo.serverId }/${ $scope.publicInfo.accountId }/ban`, {
          time: $filter('ban')(+$scope.publicInfo.banTime) * 60 * 1000,
        }).then(success => {
          $scope.publicInfo.hide();
        });
      };
      $scope.setDialogWidth = () => {
        if($mdMedia('xs') || $mdMedia('sm')) {
          return { 'min-width': '325px' };
        }
        return { 'min-width': '400px' };
      };
    }],
    fullscreen: false,
    clickOutsideToClose: true,
  };
  const show = (serverId, accountId) => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.serverId = serverId;
    publicInfo.accountId = accountId;
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
  };
}]);
