const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

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
