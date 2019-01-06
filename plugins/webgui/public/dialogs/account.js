const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

// app.factory('accountSortTool', [ () => {
//   const sort = (accountInfo, method) => {
//     accountInfo.account = accountInfo.originalAccount.sort((a, b) => {
//       if(method.sort === 'port_asc') {
//         return a.port >= b.port ? 1 : -1;
//       } else if (method.sort === 'port_desc') {
//         return a.port <= b.port ? 1 : -1;
//       } else if (method.sort === 'expire_desc') {
//         if(!a.data) { return -1; }
//         if(!b.data) { return 1; }
//         return a.data.expire <= b.data.expire ? 1 : -1;
//       } else if (method.sort === 'expire_asc') {
//         if(!a.data) { return 1; }
//         if(!b.data) { return -1; }
//         return a.data.expire >= b.data.expire ? 1 : -1;
//       }
//     });
//     accountInfo.account = accountInfo.account.filter(f => {
//       let show = true;
//       if(!method.filter.unlimit && f.type === 1) {
//         show = false;
//       }
//       if(!method.filter.expired && f.data && f.data.expire >= Date.now()) {
//         show = false;
//       }
//       if(!method.filter.unexpired && f.data && f.data.expire <= Date.now()) {
//         show = false;
//       }
//       return show;
//     });
//   };
//   return sort;
// }]);

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
    controller: ['$scope', '$mdDialog', '$localStorage', '$http', 'bind', function($scope, $mdDialog, $localStorage, $http, bind) {
      $scope.publicInfo = bind;
      $scope.publicInfo.accountFilter = $localStorage.admin.accountFilterSettings;
      $http.get('/api/admin/order').then(success => {
        $scope.publicInfo.orders = success.data.filter(f => !f.baseId);
        $scope.publicInfo.orders.unshift({ id: 0, name: '全部' });
      });
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
