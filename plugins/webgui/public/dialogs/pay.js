const app = angular.module('app');
const window = require('window');
const cdn = window.cdn || '';

app.factory('payDialog' , [ '$mdDialog', '$interval', '$timeout', '$http', '$localStorage', 'configManager', ($mdDialog, $interval, $timeout, $http, $localStorage, configManager) => {
  const publicInfo = {
    config: configManager.getConfig(),
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
    payType: [],
  };
  if(publicInfo.config.alipay) { publicInfo.payType.push({ type: 'alipay', name: '支付宝' }); }
  if(publicInfo.config.paypal) { publicInfo.payType.push({ type: 'paypal', name: 'Paypal' }); }
  if(publicInfo.config.giftcard) { publicInfo.payType.push({ type: 'giftcard', name: '充值码' }); }
  publicInfo.myPayType = publicInfo.payType[0] ? publicInfo.payType[0].type : undefined;
  let dialogPromise = null;
  const createOrder = () => {
    publicInfo.status = 'loading';
    if(publicInfo.config.alipay && publicInfo.myPayType === 'alipay') {
      $http.post('/api/user/order/qrcode', {
        accountId: publicInfo.accountId,
        orderId: publicInfo.orderId,
      }).then(success => {
        publicInfo.myOrderId = success.data.orderId;
        publicInfo.qrCode = success.data.qrCode;
        publicInfo.status = 'pay';

        interval = $interval(() => {
          $http.post('/api/user/order/status', {
            orderId: publicInfo.myOrderId,
          }).then(success => {
            const orderStatus = success.data.status;
            if(orderStatus === 'TRADE_SUCCESS' || orderStatus === 'FINISH') {
              publicInfo.status = 'success';
              publicInfo.message = '订单会在两分钟内生效，请稍候';
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
    const env = publicInfo.config.paypalMode === 'sandbox' ? 'sandbox' : 'production';
    if(publicInfo.myPayType === 'paypal') {
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
            orderId: publicInfo.orderId,
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
            publicInfo.message = '订单会在两分钟内生效，请稍候';
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
    fullscreen: false,
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
  const choosePayType = account => {
    publicInfo.status = 'type';
    publicInfo.account = account;
    publicInfo.accountId = account ? account.id : null;
    if(account) {
      publicInfo.orderId = account.orderId;
    }
    dialogPromise = $mdDialog.show(dialog);
    if(publicInfo.payType.length === 1) {
      publicInfo.jumpToPayPage();
    }
    return dialogPromise;
  };
  const chooseOrderType = () => {
    publicInfo.status = 'loading';
    $http.get('/api/user/order/price', {
      params: { accountId: publicInfo.accountId }
    }).then(success => {
      publicInfo.orders = success.data.sort((a, b) => {
        if(a.baseId > 0 && b.baseId === 0) { return 1; }
        if(a.baseId === 0 && b.baseId > 0) { return -1; }
        return a[publicInfo.myPayType] - b[publicInfo.myPayType];
      });
      if(publicInfo.orderId) { publicInfo.setOrder(publicInfo.orderId); }
      $timeout(() => {
        publicInfo.status = 'choose';
      }, 125);
    }).catch(() => {
      publicInfo.status = 'error';
    });
  };
  const giftCard = () => {
    publicInfo.status = 'giftcard';
  };
  const payByGiftCard = () => {
    publicInfo.status = 'loading';
    $http.post('/api/user/giftcard/use', {
      accountId: publicInfo.accountId,
      password: publicInfo.giftCardPassword
    }).then(result => {
      const data = result.data;
      if (data.success) {
        publicInfo.status = 'success';
        publicInfo.message = `充值码[ ${ publicInfo.giftCardPassword } ]使用成功`;
        publicInfo.giftCardPassword = '';
      } else {
        publicInfo.status = 'error';
        publicInfo.message = data.message;
      }
    }).catch(err => {
      publicInfo.status = 'error';
      publicInfo.message = '充值出现错误';
    });
  };
  const jumpToPayPage = () => {
    if(publicInfo.myPayType === 'giftcard') {
      giftCard();
    } else {
      chooseOrderType();
    }
  };
  const showComment = () => {
    publicInfo.comment = publicInfo.selectedOrder.comment;
    if(!publicInfo.comment) {
      publicInfo.createOrder();
    } else {
      publicInfo.status = 'comment';
      publicInfo.time = 3;
      $interval(() => {
        if(publicInfo.time >= 1) {
          publicInfo.time--;
        }
      }, 1000, 3);
    }
  };
  publicInfo.jumpToPayPage = jumpToPayPage;
  publicInfo.payByGiftCard = payByGiftCard;
  publicInfo.showComment = showComment;
  const setOrder = orderId => {
    publicInfo.selectedOrder = publicInfo.orders.filter(f => {
      return f.id === +orderId;
    })[0];
  };
  publicInfo.setOrder = setOrder;
  return {
    choosePayType,
    chooseOrderType,
    createOrder,
  };
}]);
