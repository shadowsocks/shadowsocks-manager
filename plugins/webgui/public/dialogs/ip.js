const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('ipDialog', [ '$mdDialog', 'adminApi', ($mdDialog, adminApi) => {
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
    templateUrl: `${ cdn }/public/views/dialog/ip.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$state', '$http', '$mdDialog', '$mdMedia', '$q', 'bind', function($scope, $state, $http, $mdDialog, $mdMedia, $q, bind) {
      $scope.publicInfo = bind;
      $scope.setDialogWidth = () => {
        if($mdMedia('xs') || $mdMedia('sm')) {
          return {};
        }
        return { 'min-width': '400px' };
      };
      $q.all([
        $http.get(`/api/admin/account/${ $scope.publicInfo.serverId }/${ $scope.publicInfo.accountId }/ip`),
        $http.get(`/api/admin/account/${ $scope.publicInfo.accountId }/ip`),
      ]).then(success => {
        $scope.ip = success[0].data.ip.map(i => {
          return { ip: i };
        });
        $scope.allIp = success[1].data.ip.map(i => {
          return { ip: i };
        });
        $scope.ip.forEach(ip => {
          getIpInfo(ip.ip).then(success => {
            ip.info = success;
          });
        });
        $scope.allIp.forEach(ip => {
          getIpInfo(ip.ip).then(success => {
            ip.info = success;
          });
        });
      });
      const getIpInfo = ip => adminApi.getIpInfo(ip);
    }],
    fullscreen: true,
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
