function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const alipayf2f = require('alipay-ftof');
const alipay_f2f = new alipayf2f(require('./config.js'));
const knex = appRequire('init/knex').knex;
const account = appRequire('plugins/account/index');

const createOrder = (() => {
  var _ref = _asyncToGenerator(function* (user, account, amount) {
    const orderId = Math.random().toString().substr(2);
    const time = 30;
    const qrCode = yield alipay_f2f.createQRPay({
      tradeNo: orderId,
      subject: 'ss',
      totalAmount: +amount,
      body: 'ss',
      timeExpress: 10
    });
    yield knex('alipay').insert({
      orderId,
      qrcode: qrCode.qr_code,
      amount: amount + '',
      user,
      account,
      status: 'CREATE',
      createTime: Date.now(),
      expireTime: Date.now() + time * 60 * 1000
    });
    return {
      orderId,
      qrCode: qrCode.qr_code
    };
  });

  return function createOrder(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
})();

setInterval(_asyncToGenerator(function* () {
  const orders = yield knex('alipay').select().whereNotBetween('expireTime', [0, Date.now()]);
  orders.forEach(function (order) {
    if (order.status !== 'TRADE_SUCCESS' && order.status !== 'FINISH') {
      alipay_f2f.checkInvoiceStatus(order.orderId).then(function (success) {
        if (success.code === '10000') {
          knex('alipay').update({
            status: success.trade_status
          }).where({
            orderId: order.orderId
          }).then();
        }
      });
    } else if (order.status === 'TRADE_SUCCESS') {
      const accountId = order.account;
      account.addAccountLimit(accountId).then(function () {
        return knex('alipay').update({
          status: 'FINISH'
        }).where({
          orderId: order.orderId
        });
      }).then().catch(console.log);
    };
  });
}), 30 * 1000);

const checkOrder = (() => {
  var _ref3 = _asyncToGenerator(function* (orderId) {
    const order = yield knex('alipay').select().where({
      orderId
    }).then(function (success) {
      if (success.length) {
        return success[0];
      }
      return Promise.reject('order not found');
    });
    return order.status;
  });

  return function checkOrder(_x4) {
    return _ref3.apply(this, arguments);
  };
})();

exports.createOrder = createOrder;
exports.checkOrder = checkOrder;