const app = require('../index').app;

app.factory('alertDialog' , [ '$mdDialog', ($mdDialog) => {
  const publicInfo = {};
  publicInfo.isLoading = false;
  publicInfo.content = '';
  publicInfo.button = '';
  const close = () => {
    return $mdDialog.hide().then(success => {
      publicInfo.isLoading = false;
      alertDialogPromise = null;
      return;
    }).catch(err => {
      publicInfo.isLoading = false;
      alertDialogPromise = null;
      return;
    });
  };
  publicInfo.close = close;
  let alertDialogPromise = null;
  const isDialogShow = () => {
    if(alertDialogPromise && !alertDialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: '/public/views/home/alertDialog.html',
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', 'bind', function($scope, $mdDialog, bind) {
      $scope.publicInfo = bind;
    }],
    clickOutsideToClose: false,
  };
  const show = (content, button) => {
    publicInfo.content = content;
    publicInfo.button = button;
    if(isDialogShow()) {
      publicInfo.isLoading = false;
      return alertDialogPromise;
    }
    alertDialogPromise = $mdDialog.show(dialog);
    return alertDialogPromise;
  };
  const loading = () => {
    publicInfo.isLoading = true;
    if(!isDialogShow()) {
      show();
    }
  };
  return {
    show,
    loading,
    close,
  };
}]);

app.factory('payDialog' , [ '$mdDialog', '$interval', '$http', ($mdDialog, $interval, $http) => {
  const publicInfo = {};
  publicInfo.isLoading = false;
  publicInfo.qrCode = '';
  let interval = null;
  const close = () => {
    interval && $interval.cancel(interval);
    return $mdDialog.hide().then(success => {
      publicInfo.isLoading = false;
      payDialogPromise = null;
      return;
    }).catch(err => {
      publicInfo.isLoading = false;
      payDialogPromise = null;
      return;
    });
  };
  publicInfo.close = close;
  let payDialogPromise = null;
  const isDialogShow = () => {
    if(payDialogPromise && !payDialogPromise.$$state.status) {
      return true;
    }
    return false;
  };
  const dialog = {
    templateUrl: '/public/views/user/payDialog.html',
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    controller: ['$scope', '$mdDialog', '$mdMedia', 'bind', function($scope, $mdDialog, $mdMedia, bind) {
      $scope.getQrCodeSize = () => {
        if($mdMedia('xs') || $mdMedia('sm')) {
          return 200;
        }
        return 250;
      };
      $scope.publicInfo = bind;
      $scope.qrCode = () => { return $scope.publicInfo.qrCode || 'AAA'; };
      $scope.pay = () => {
        window.location.href = $scope.publicInfo.qrCode;
      };
    }],
    clickOutsideToClose: false,
  };
  const setUrl = (orderId, url) => {
    if(orderId && url) {
      interval = $interval(() => {
        $http.post('/api/user/order/status', {
          orderId,
        }).then(success => {
          const orderStatus = success.data.status;
          if(orderStatus === 'TRADE_SUCCESS' || orderStatus === 'FINISH') {
            close();
          }
        });
      }, 5 * 1000);
    }
    publicInfo.qrCode = url;
    if(isDialogShow()) {
      publicInfo.isLoading = false;
      return payDialogPromise;
    }
    payDialogPromise = $mdDialog.show(dialog);
    return payDialogPromise;
  };
  const loading = () => {
    publicInfo.isLoading = true;
    if(!isDialogShow()) {
      setUrl();
    }
  };
  return {
    setUrl,
    loading,
    close,
  };
}]);
