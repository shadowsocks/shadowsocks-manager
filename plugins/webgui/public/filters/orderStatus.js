const app = require('../index').app;

app.filter('order', function() {
  return function(status) {
    const result = {
      CREATE: '创建',
      FINISH: '完成',
      TRADE_CLOSED: '关闭',
    };
    return result[status] || '其它';
  };
});
