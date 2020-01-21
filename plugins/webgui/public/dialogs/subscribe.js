const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('subscribeDialog', [ '$mdDialog', '$http', 'configManager', ($mdDialog, $http, configManager) => {
  const publicInfo = { linkType: 'android', ip: '0', flow: '0' };
  const config = configManager.getConfig();
  publicInfo.userType = config.status === 'admin' ? 'admin' : 'user';
  publicInfo.updateSubscribePage = false;
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
  const getSubscribe = () => {
    return $http.get(`/api/${publicInfo.userType}/account/${ publicInfo.accountId }/subscribe`);
  };
  publicInfo.getSubscribe = getSubscribe;
  const updateSubscribe = () => {
    return $http.put(`/api/user/account/${ publicInfo.accountId }/subscribe`);
  };
  publicInfo.updateSubscribe = updateSubscribe;
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: `${ cdn }/public/views/dialog/subscribe.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdMedia', '$mdDialog', 'bind', 'configManager', '$mdToast', function($scope, $mdMedia, $mdDialog, bind, configManager, $mdToast) {
      $scope.publicInfo = bind;
      $scope.publicInfo.types = [
        'android', 'shadowrocket', 'potatso', 'ssr', 'ssd', 'clash', 'mellow',
      ];
      const config = configManager.getConfig();
      $scope.publicInfo.toUpdateSubscribePage = () => {
        $scope.publicInfo.updateSubscribePage = true;
      };
      $scope.changeLinkType = () => {
        $scope.publicInfo.subscribeLink = `${ config.site }/api/user/account/subscribe/${ $scope.publicInfo.token }?type=${ $scope.publicInfo.linkType }&ip=${ $scope.publicInfo.ip}&flow=${ $scope.publicInfo.flow}`;
      };
      $scope.publicInfo.getSubscribe().then(success => {
        $scope.publicInfo.token = success.data.subscribe;
        $scope.publicInfo.subscribeLink = `${ config.site }/api/user/account/subscribe/${ $scope.publicInfo.token }?type=${ $scope.publicInfo.linkType }&ip=${ $scope.publicInfo.ip}&flow=${ $scope.publicInfo.flow}`;
      });
      $scope.publicInfo.updateLink = () => {
        $scope.publicInfo.updateSubscribe().then(success => {
          $scope.publicInfo.token = success.data.subscribe;
          $scope.publicInfo.subscribeLink = `${ config.site }/api/user/account/subscribe/${ $scope.publicInfo.token }?type=${ $scope.publicInfo.linkType }&ip=${ $scope.publicInfo.ip}&flow=${ $scope.publicInfo.flow}`;
          $scope.publicInfo.updateSubscribePage = false;
        });
      };
      $scope.toast = () => {
        $mdToast.show(
          $mdToast.simple()
            .textContent('链接已复制到剪贴板')
            .position('top right')
            .hideDelay(3000)
        );
      };
    }],
    fullscreen: false,
    clickOutsideToClose: true,
  };
  const show = accountId => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.accountId = accountId;
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
  };
}]);
