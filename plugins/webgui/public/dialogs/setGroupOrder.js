const app = angular.module('app');
const cdn = window.cdn || '';

app.factory('setGroupOrderDialog' , [ '$mdDialog', $mdDialog => {
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
    templateUrl: `${ cdn }/public/views/dialog/setGroupOrder.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', 'bind', function($scope, bind) {
      $scope.publicInfo = bind;
    }],
    clickOutsideToClose: true,
  };
  const show = (group, orders, orderObj) => {
    publicInfo.group = group;
    publicInfo.orders = orders;
    publicInfo.orderObj = orderObj;
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
