const log4js = require('log4js');
const logger = log4js.getLogger('alipay');

const config = appRequire('services/config').all();
const alipayf2f = require('alipay-ftof');
const alipay_f2f = new alipayf2f({
  appid: config.plugins.alipay.appid,
  notifyUrl: config.plugins.alipay.notifyUrl,
  merchantPrivateKey: '-----BEGIN RSA PRIVATE KEY-----\n' + config.plugins.alipay.merchantPrivateKey + '\n-----END RSA PRIVATE KEY-----',
  alipayPublicKey: '-----BEGIN PUBLIC KEY-----\n' + config.plugins.alipay.alipayPublicKey + '\n-----END PUBLIC KEY-----',
  gatewayUrl: config.plugins.alipay.gatewayUrl,
});
// const alipay_f2f = new alipayf2f(require("./config.js"));
const knex = appRequire('init/knex').knex;
const account = appRequire('plugins/account/index');
const moment = require('moment');

const createOrder = async (user, account, amount, orderType = 3) => {
  const oldOrder = await knex('alipay').select().where({
    user,
    account: account ? account : null,
    amount: amount + '',
    orderType,
  }).where('expireTime', '>', Date.now() + 15 * 60 * 1000).where({
    status: 'CREATE',
  }).then(success => {
    return success[0];
  });
  if(oldOrder) {
    return {
      orderId: oldOrder.orderId,
      qrCode: oldOrder.qrcode,
    };
  }
  const orderId = moment().format('YYYYMMDDHHmmss') + Math.random().toString().substr(2, 6);
  const time = 60;
  const qrCode = await alipay_f2f.createQRPay({
    tradeNo: orderId,
    subject: 'ss续费',
    totalAmount: +amount,
    body: 'ss',
    timeExpress: 10,
  });
  await knex('alipay').insert({
    orderId,
    orderType,
    qrcode: qrCode.qr_code,
    amount: amount + '',
    user,
    account: account ? account : null,
    status: 'CREATE',
    createTime: Date.now(),
    expireTime: Date.now() + time * 60 * 1000,
  });
  logger.info(`create order: [${ orderId }][${ amount }][account: ${ account }]`);
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
      const userId = order.user;
      // account.addAccountLimitToMonth(userId, accountId)
      account.setAccountLimit(userId, accountId, order.orderType)
      .then(() => {
        return knex('alipay').update({
          status: 'FINISH',
        }).where({
          orderId: order.orderId,
        });
      }).then().catch(console.log);
    };
  });
}, 60 * 1000);

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

const verifyCallback = (data) => {
  const signStatus = alipay_f2f.verifyCallback(data);
  if(signStatus) {
    knex('alipay').update({
      status: data.trade_status,
      alipayData: JSON.stringify(data),
    }).where({
      orderId: data.out_trade_no,
    }).andWhereNot({
      status: 'FINISH',
    }).then();
  }
  return signStatus;
};

const orderList = async (options = {}) => {
  const where = {};
  if(options.userId) {
    where['user.id'] = options.userId;
  }
  const orders = await knex('alipay').select([
    'alipay.orderId',
    'user.username',
    'account_plugin.port',
    'alipay.amount',
    'alipay.status',
    'alipay.alipayData',
    'alipay.createTime',
    'alipay.expireTime',
  ])
  .leftJoin('user', 'user.id', 'alipay.user')
  .leftJoin('account_plugin', 'account_plugin.id', 'alipay.account')
  .where(where)
  .orderBy('alipay.createTime', 'DESC');
  orders.forEach(f => {
    f.alipayData = JSON.parse(f.alipayData);
  });
  return orders;
};

exports.orderList = orderList;
exports.createOrder = createOrder;
exports.checkOrder = checkOrder;
exports.verifyCallback = verifyCallback;
