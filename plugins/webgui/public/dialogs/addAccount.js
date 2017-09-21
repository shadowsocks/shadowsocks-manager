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
    controller: ['$scope', '$mdMedia', '$mdDialog', '$http', '$localStorage', 'bind',
      function($scope, $mdMedia, $mdDialog, $http, $localStorage, bind) {
        $scope.publicInfo = bind;
        $scope.setDialogWidth = () => {
          if($mdMedia('xs') || $mdMedia('sm')) {
            return {};
          }
          return { 'min-width': '400px', 'max-width': '640px' };
        };
        $scope.$watch('publicInfo.mac.account', () => {
          const account = $scope.publicInfo.account.filter(f => {
            return f.id === $scope.publicInfo.mac.account;
          })[0];
          if(!account.server) {
            $scope.publicInfo.validServer = $scope.publicInfo.server;
          } else {
            $scope.publicInfo.validServer = $scope.publicInfo.server.filter(f => {
              return JSON.parse(account.server).indexOf(f.id) >= 0;
            });
          }
        });
      }
    ],
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
  const macAddress = () => {
    publicInfo.status = 'mac';
    publicInfo.mac = {
      account: publicInfo.account[0].id,
      server: publicInfo.server[0].id,
    };
  };
  const next = () => {
    if(publicInfo.accountType === 'port') {
      getAccountPort();
    } else if(publicInfo.accountType === 'mac') {
      macAddress();
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
  const setMac = () => {
    $http.post(`/api/admin/account/mac/${ publicInfo.mac.macAddress }`, {
      userId: publicInfo.userId,
      accountId: publicInfo.mac.account,
      serverId: publicInfo.mac.server
    }).then(success => {
      hide();
    });
  };
  publicInfo.setMac = setMac;
  const editMac = () => {
    $http.put(`/api/admin/account/mac`, {
      id: publicInfo.mac.id,
      macAddress: publicInfo.mac.macAddress,
      accountId: publicInfo.mac.account,
      serverId: publicInfo.mac.server
    }).then(success => {
      hide();
    });
  };
  publicInfo.editMac = editMac;
  const edit = (accountInfo, account, server) => {
    publicInfo.account = account;
    publicInfo.server = server;
    publicInfo.mac = {
      id: accountInfo.id,
      macAddress: accountInfo.mac,
      account: accountInfo.accountId,
      server: accountInfo.serverId,
    };
    publicInfo.isLoading = false;
    publicInfo.status = 'edit';
    if(isDialogShow()) {
      return dialogPromise;
    }
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  const show = (userId, account, server) => {
    publicInfo.userId = userId;
    publicInfo.account = account;
    publicInfo.server = server;
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
    edit,
  };
}]);