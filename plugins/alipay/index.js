const alipayf2f = require('alipay-ftof');
const alipay_f2f = new alipayf2f(require('./config.js'));
const knex = appRequire('init/knex').knex;
const account = appRequire('plugins/account/index');

const createOrder = async (user, account, amount) => {
  const orderId = Math.random().toString().substr(2);
  const time = 30;
  const qrCode = await alipay_f2f.createQRPay({
    tradeNo: orderId,
    subject: 'ss',
    totalAmount: +amount,
    body: 'ss',
    timeExpress: 10,
  });
  await knex('alipay').insert({
    orderId,
    qrcode: qrCode.qr_code,
    amount: amount + '',
    user,
    account,
    status: 'CREATE',
    createTime: Date.now(),
    expireTime: Date.now() + time * 60 * 1000,
  });
  return {
    orderId,
    qrCode: qrCode.qr_code,
  };
};

setInterval(async () => {
  const orders = await knex('alipay').select().whereNotBetween('expireTime', [0, Date.now()]);
  orders.forEach(order => {
    if(order.status !== 'TRADE_SUCCESS' && order.status !== 'FINISH') {
      alipay_f2f.checkInvoiceStatus(order.orderId).then(success => {
        if(success.code === '10000') {
          knex('alipay').update({
            status: success.trade_status
          }).where({
            orderId: order.orderId,
          }).then();
        }
      });
    } else if(order.status === 'TRADE_SUCCESS') {
      const accountId = order.account;
      account.addAccountLimit(accountId).then(() => {
        return knex('alipay').update({
          status: 'FINISH',
        }).where({
          orderId: order.orderId,
        });
      }).then().catch(console.log);
    };
  });
}, 30 * 1000);

const checkOrder = async (orderId) => {
  const order = await knex('alipay').select().where({
    orderId,
  }).then(success => {
    if(success.length) {
      return success[0];
    }
    return Promise.reject('order not found');
  });
  return order.status;
};

exports.createOrder = createOrder;
exports.checkOrder = checkOrder;
