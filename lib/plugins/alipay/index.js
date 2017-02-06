function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const alipayf2f = require('alipay-ftof');
const alipay_f2f = new alipayf2f(require('./config.js'));
const knex = appRequire('init/knex').knex;

// alipay_f2f.createQRPay({
//   tradeNo: "123",
//   subject: "z",
//   totalAmount: 0.5,
//   body: "t",
//   timeExpress: 5,
// }).then(result => {
//   console.log(result);
// }).catch(error => console.error(error));
//
// setInterval(() => {
//   alipay_f2f.checkInvoiceStatus("123").then(result => {
//     console.log(result);
//   }).catch(error => { });
// }, 10 * 1000);

const createOrder = (() => {
  var _ref = _asyncToGenerator(function* () {
    const orderId = Math.random().toString().substr(2);
    const qrCode = yield alipay_f2f.createQRPay({
      tradeNo: orderId,
      subject: "z",
      totalAmount: 0.5,
      body: "t",
      timeExpress: 5
    });
    console.log(qrCode);
    yield knex('alipay').insert({
      orderId,
      createTime: Date.now()
    });
  });

  return function createOrder() {
    return _ref.apply(this, arguments);
  };
})();

setInterval(_asyncToGenerator(function* () {
  const orders = yield knex('alipay').select();
  orders.forEach(function (order) {
    if (order.status === 'TRADE_SUCCESS') {
      return;
    };
    alipay_f2f.checkInvoiceStatus(order.orderId).then(function (success) {
      console.log(success);
      if (success.code === '10000') {
        knex('alipay').update({
          status: success.trade_status
        }).where({
          orderId: order.orderId
        }).then();
      }
    });
  });
}), 20 * 1000);

const checkOrder = () => {};

exports.createOrder = createOrder;
exports.checkOrder = checkOrder;

createOrder();