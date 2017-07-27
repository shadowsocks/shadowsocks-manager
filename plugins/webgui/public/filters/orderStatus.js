const app = angular.module('app');

app.filter('order', function() {
  return function(status) {
    const result = {
      CREATE: '创建',
      WAIT_BUYER_PAY: '等待',
      TRADE_SUCCESS: '付款',
      FINISH: '完成',
      TRADE_CLOSED: '关闭',
      created: '创建',
      approved: '付款',
      finish: '完成',
      closed: '关闭',
    };
    return result[status] || '其它';
  };
})
.filter('prettyOrderId', function() {
  return function(id) {
    return `${ id.substr(0, 4) }-${ id.substr(4, 2) }-${ id.substr(6, 2) } ${ id.substr(8, 2) }:${ id.substr(10, 2) }:${ id.substr(12, 2) } ${ id.substr(14) }`;
  };
});
