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

const createOrder = async () => {
  const orderId = Math.random().toString().substr(2);
  const qrCode = await alipay_f2f.createQRPay({
    tradeNo: orderId,
    subject: "z",
    totalAmount: 0.5,
    body: "t",
    timeExpress: 5,
  });
  console.log(qrCode);
  await knex('alipay').insert({
    orderId,
    createTime: Date.now(),
  });
};

setInterval(async () => {
  const orders = await knex('alipay').select();
  orders.forEach(order => {
    if(order.status === 'TRADE_SUCCESS') {
      return;
    };
    alipay_f2f.checkInvoiceStatus(order.orderId).then(success => {
      console.log(success);
      if(success.code === '10000') {
        knex('alipay').update({
          status: success.trade_status
        }).where({
          orderId: order.orderId,
        }).then();
      }
    });
  });
}, 20 * 1000);

const checkOrder = () => {

};

exports.createOrder = createOrder;
exports.checkOrder = checkOrder;

createOrder();
