const app = angular.module('app');

app.filter('order', function () {
  return function (status) {
    const result = {
      CREATE: '创建',
      WAIT_BUYER_PAY: '等待',
      TRADE_SUCCESS: '付款',
      FINISH: '完成',
      USED: '完成',
      TRADE_CLOSED: '关闭',
      created: '创建',
      approved: '付款',
      finish: '完成',
      closed: '关闭',
    };
    return result[status] || '其它';
  };
})
.filter('prettyOrderId', function () {
  return function (id) {
    return `${id.substr(0, 4)}-${id.substr(4, 2)}-${id.substr(6, 2)} ${id.substr(8, 2)}:${id.substr(10, 2)}:${id.substr(12, 2)} ${id.substr(14)}`;
  };
}).filter('prettyOrderType', function () {
  // TODO: 将此处的类型和其他地方的类型代码全部集中到一处
  return function (type) {
    const cardType = {
      5: '小时',
      4: '日',
      2: '周',
      3: '月',
      6: '季度',
      7: '年',
      8: '两周',
      9: '半年',
    };
    return cardType[type];
  };
});
