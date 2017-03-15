const app = angular.module('app');

app.filter('order', function() {
  return function(status) {
    const result = {
      CREATE: '创建',
      WAIT_BUYER_PAY: '等待',
      TRADE_SUCCESS: '付款',
      FINISH: '完成',
      TRADE_CLOSED: '关闭',
    };
    return result[status] || '其它';
  };
});
