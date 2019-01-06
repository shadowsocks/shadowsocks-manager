const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('addGiftCardBatchDialog', ['$mdDialog', '$http', ($mdDialog, $http) => {
  const publicInfo = {
    status: 'show',
    count: 20,
    orderId: 3,
  };

  $http.get('/api/admin/order').then(success => {
    publicInfo.orderList = success.data;
  });

  let dialogPromise = null;
  const isDialogShow = () => dialogPromise && !dialogPromise.$$state.status;

  const show = () => {
    if (isDialogShow()) {
      return dialogPromise;
    }
    publicInfo.status = 'show';
    dialogPromise = $mdDialog.show(dialog);
    return dialogPromise;
  };

  const close = () => {
    $mdDialog.hide();
    dialogPromise = null;
  };

  const submit = () => {
    publicInfo.status = 'loading';
    $http.post('/api/admin/giftcard/add', {
      count: publicInfo.count,
      orderId: publicInfo.orderId,
      comment: publicInfo.comment,
    })
    .then(() => close())
    .catch(err => { publicInfo.status = 'error'; });
  };
  publicInfo.close = close;
  publicInfo.submit = submit;

  const dialog = {
    templateUrl: `${cdn}/public/views/dialog/addGiftCardBatch.html`,
    escapeToClose: true,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', 'bind', ($scope, bind) => {
      $scope.publicInfo = bind;
    }],
    clickOutsideToClose: false,
  };
  return { show };
}]);
