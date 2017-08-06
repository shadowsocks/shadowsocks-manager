const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('accountSortTool', [ () => {
  const sort = (accountInfo, method) => {
    accountInfo.account = accountInfo.originalAccount.sort((a, b) => {
      if(method.sort === 'port_asc') {
        return a.port >= b.port ? 1 : -1;
      } else if (method.sort === 'port_desc') {
        return a.port <= b.port ? 1 : -1;
      } else if (method.sort === 'expire_desc') {
        if(!a.data) { return -1; }
        if(!b.data) { return 1; }
        return a.data.expire <= b.data.expire ? 1 : -1;
      } else if (method.sort === 'expire_asc') {
        if(!a.data) { return 1; }
        if(!b.data) { return -1; }
        return a.data.expire >= b.data.expire ? 1 : -1;
      }
    });
    accountInfo.account = accountInfo.account.filter(f => {
      let show = true;
      if(!method.filter.unlimit && f.type === 1) {
        show = false;
      }
      if(!method.filter.expired && f.data && f.data.expire >= Date.now()) {
        show = false;
      }
      if(!method.filter.unexpired && f.data && f.data.expire <= Date.now()) {
        show = false;
      }
      return show;
    });
  };
  return sort;
}]);

app.factory('accountSortDialog' , [ '$mdDialog', ($mdDialog) => {
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
    templateUrl: `${ cdn }/public/views/admin/accountSortAndFilterDialog.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', '$sessionStorage', 'accountSortTool', 'bind', function($scope, $mdDialog, $sessionStorage, accountSortTool, bind) {
      $scope.publicInfo = bind;
      $scope.sortAndFilter = () => {
        accountSortTool($scope.publicInfo.accountInfo, $scope.publicInfo.accountMethod);
      };
    }],
    clickOutsideToClose: true,
  };
  const show = (accountMethod, accountInfo) => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.accountMethod = accountMethod;
    publicInfo.accountInfo = accountInfo;
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
    hide,
  };
}]);

app.factory('userSortDialog' , [ '$mdDialog', ($mdDialog) => {
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
    templateUrl: `${ cdn }/public/views/admin/userSortDialog.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', '$localStorage', 'bind', function($scope, $mdDialog, $localStorage, bind) {
      $scope.publicInfo = bind;
      $scope.userSort = $localStorage.admin.userSortSettings;
    }],
    clickOutsideToClose: true,
  };
  const show = () => {
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

app.factory('orderFilterDialog' , [ '$mdDialog', ($mdDialog) => {
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
    templateUrl: `${ cdn }/public/views/admin/orderFilterDialog.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', '$localStorage', 'bind', function($scope, $mdDialog, $localStorage, bind) {
      $scope.publicInfo = bind;
      $scope.orderFilter = $localStorage.admin.orderFilterSettings;
    }],
    clickOutsideToClose: true,
  };
  const show = () => {
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

app.factory('orderDialog', [ '$mdDialog', '$state', ($mdDialog, $state) => {
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
  const toUserPage = userId => {
    hide();
    $state.go('admin.userPage', { userId });
  };
  publicInfo.toUserPage = toUserPage;
  let dialogPromise = null;
  const isDialogShow = () => {
    if(dialogPromise && !dialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: `${ cdn }/public/views/admin/orderDialog.html`,
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
  const show = (order) => {
    if(isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.order = order;
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };
  return {
    show,
  };
}]);


