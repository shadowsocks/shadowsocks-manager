const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('wireGuardConfigDialog', [ '$mdDialog', ($mdDialog) => {
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
    templateUrl: `${ cdn }/public/views/dialog/showWireGuardConfig.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', '$mdMedia', 'bind', function($scope, $mdDialog, $mdMedia, bind) {
      $scope.publicInfo = bind;
      const a = $scope.publicInfo.account.port % 254;
      const b = ($scope.publicInfo.account.port - a) / 254;
      $scope.publicInfo.config = [
        '[Interface]',
        `Address = ${ $scope.publicInfo.server.net.split('.')[0] }.${ $scope.publicInfo.server.net.split('.')[1] }.${ b }.${ a + 1 }/32`,
        `PrivateKey = ${ $scope.publicInfo.account.privateKey }`,
        'DNS = 8.8.8.8',
        '[Peer]',
        `PublicKey = ${ $scope.publicInfo.server.key }`,
        `Endpoint = ${ $scope.publicInfo.server.host }:${ $scope.publicInfo.server.wgPort }`,
        `AllowedIPs = 0.0.0.0/0`,
      ].join('\n');
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
  const show = (server, account) => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.server = server;
    publicInfo.account = account;
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
  };
}]);
