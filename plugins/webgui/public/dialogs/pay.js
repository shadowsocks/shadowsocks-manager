const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('payDialog' , [ '$mdDialog', '$interval', '$timeout', '$http', '$localStorage', ($mdDialog, $interval, $timeout, $http, $localStorage) => {
  const publicInfo = {
    config: JSON.parse(window.ssmgrConfig),
    orderType: 'month',
    time: [{
      type: 'hour', name: '一小时'
    }, {
      type: 'day', name: '一天'
    }, {
      type: 'week', name: '一周'
    }, {
      type: 'month', name: '一个月'
    }, {
      type: 'season', name: '三个月'
    }, {
      type: 'year', name: '一年'
    }],
  };
  let dialogPromise = null;
  const createOrder = () => {
    publicInfo.status = 'loading';
    if(publicInfo.alipay[publicInfo.orderType] && publicInfo.config.alipay) {
      $http.post('/api/user/order/qrcode', {
        accountId: publicInfo.accountId,
        orderType: publicInfo.orderType,
      }).then(success => {
        publicInfo.orderId = success.data.orderId;
        publicInfo.qrCode = success.data.qrCode;
        publicInfo.status = 'pay';

        interval = $interval(() => {
          $http.post('/api/user/order/status', {
            orderId: publicInfo.orderId,
          }).then(success => {
            const orderStatus = success.data.status;
            if(orderStatus === 'TRADE_SUCCESS' || orderStatus === 'FINISH') {
              publicInfo.status = 'success';
              interval && $interval.cancel(interval);
            }
          });
        }, 5 * 1000);
      }).catch(() => {
        publicInfo.status = 'error';
      });
    } else {
      publicInfo.status = 'pay';
    }
    const env = JSON.parse(window.ssmgrConfig).paypalMode === 'sandbox' ? 'sandbox' : 'production';
      if(publicInfo.paypal[publicInfo.orderType]) {
        paypal.Button.render({
          locale: $localStorage.language ? $localStorage.language.replace('-', '_') : 'zh_CN',
          style: {
            label: 'checkout', // checkout | credit | pay
            size:  'medium',   // small    | medium | responsive
            shape: 'rect',     // pill     | rect
            color: 'blue'      // gold     | blue   | silver
          },
          env, // production or sandbox
          commit: true,
          payment: function() {
            var CREATE_URL = '/api/user/paypal/create';
            return paypal.request.post(CREATE_URL, {
              accountId: publicInfo.accountId,
              orderType: publicInfo.orderType,
            })
            .then(function(res) {
              return res.paymentID;
            });
          },
          onAuthorize: function(data, actions) {
            var EXECUTE_URL = '/api/user/paypal/execute/';
            var data = {
              paymentID: data.paymentID,
              payerID: data.payerID
            };
            return paypal.request.post(EXECUTE_URL, data)
            .then(function (res) {
              publicInfo.status = 'success';
            });
          }
        }, '#paypal-button-container');
      }
  };
  let interval = null;
  const close = () => {
    interval && $interval.cancel(interval);
    $mdDialog.hide();
  };
  publicInfo.createOrder = createOrder;
  publicInfo.close = close;
  const dialog = {
    templateUrl: `${ cdn }/public/views/dialog/pay.html`,
    escapeToClose: false,
    locals: { bind: publicInfo },
    bindToController: true,
    fullscreen: true,
    controller: ['$scope', '$mdDialog', '$mdMedia', 'bind', function($scope, $mdDialog, $mdMedia, bind) {
      $scope.publicInfo = bind;
      $scope.setDialogWidth = () => {
        if($mdMedia('xs') || $mdMedia('sm')) {
          return {};
        }
        return { 'min-width': '405px' };
      };
      $scope.getQrCodeSize = () => {
        if($mdMedia('xs') || $mdMedia('sm')) {
          return 200;
        }
        return 250;
      };
      $scope.qrCode = () => { return $scope.publicInfo.qrCode || 'invalid qrcode'; };
      $scope.pay = () => {
        window.location.href = $scope.publicInfo.qrCode;
      };
    }],
    clickOutsideToClose: false,
  };
  const chooseOrderType = accountId => {
    publicInfo.status = 'loading';
    dialogPromise = $mdDialog.show(dialog);
    $http.get('/api/user/order/price').then(success => {
      publicInfo.alipay = success.data.alipay;
      publicInfo.paypal = success.data.paypal;
      $timeout(() => {
        publicInfo.status = 'choose';
      }, 125);
      publicInfo.accountId = accountId;
      return dialogPromise;
    }).catch(() => {
      publicInfo.status = 'error';
      return dialogPromise;
    });
  };
  return {
    chooseOrderType,
    createOrder,
  };
}]);