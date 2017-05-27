const log4js = require('log4js');
const logger = log4js.getLogger('alipay');
const cron = appRequire('init/cron');
const config = appRequire('services/config').all();
const alipayf2f = require('alipay-ftof');
const alipay_f2f = new alipayf2f({
  appid: config.plugins.alipay.appid,
  notifyUrl: config.plugins.alipay.notifyUrl,
  merchantPrivateKey: '-----BEGIN RSA PRIVATE KEY-----\n' + config.plugins.alipay.merchantPrivateKey + '\n-----END RSA PRIVATE KEY-----',
  alipayPublicKey: '-----BEGIN PUBLIC KEY-----\n' + config.plugins.alipay.alipayPublicKey + '\n-----END PUBLIC KEY-----',
  gatewayUrl: config.plugins.alipay.gatewayUrl,
});
const knex = appRequire('init/knex').knex;
const account = appRequire('plugins/account/index');
const moment = require('moment');
const push = appRequire('plugins/webgui/server/push');

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
  logger.info(`创建订单: [${ orderId }][${ amount }][account: ${ account }]`);
  return {
    orderId,
    qrCode: qrCode.qr_code,
  };
};

cron.minute(async () => {
// setInterval(async () => {
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
      push.pushMessage('支付成功', {
        body: `订单[ ${ order.orderId } ][ ${ order.amount } ]支付成功`,
      });
      account.setAccountLimit(userId, accountId, order.orderType)
      .then(() => {
        return knex('alipay').update({
          status: 'FINISH',
        }).where({
          orderId: order.orderId,
        });
      }).then(() => {
        logger.info(`订单支付成功: [${ order.orderId }][${ order.amount }][account: ${ accountId }]`);
      }).catch(err => {
        logger.error(`订单支付失败: [${ order.orderId }]`, err);
      });
    };
  });
}, 1);
// }, 60 * 1000);

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
    'alipay.orderType',
    'user.id as userId',
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

const orderListAndPaging = async (options = {}) => {
  const search = options.search || '';
  const filter = options.filter || [];
  const sort = options.sort || 'alipay.createTime_desc';
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;

  let count = knex('alipay').select();
  let orders = knex('alipay').select([
    'alipay.orderId',
    'alipay.orderType',
    'user.id as userId',
    'user.username',
    'account_plugin.port',
    'alipay.amount',
    'alipay.status',
    'alipay.alipayData',
    'alipay.createTime',
    'alipay.expireTime',
  ])
  .leftJoin('user', 'user.id', 'alipay.user')
  .leftJoin('account_plugin', 'account_plugin.id', 'alipay.account');

  if(filter.length) {
    count = count.whereIn('alipay.status', filter);
    orders = orders.whereIn('alipay.status', filter);
  }
  if(search) {
    count = count.where('alipay.orderId', 'like', `%${ search }%`);
    orders = orders.where('alipay.orderId', 'like', `%${ search }%`);
  }

  count = await count.count('orderId as count').then(success => success[0].count);
  orders = await orders.orderBy(sort.split('_')[0], sort.split('_')[1]).limit(pageSize).offset((page - 1) * pageSize);
  orders.forEach(f => {
    f.alipayData = JSON.parse(f.alipayData);
  });
  const maxPage = Math.ceil(count / pageSize);
  return {
    total: count,
    page,
    maxPage,
    pageSize,
    orders,
  };
};

exports.orderListAndPaging = orderListAndPaging;
exports.orderList = orderList;
exports.createOrder = createOrder;
exports.checkOrder = checkOrder;
exports.verifyCallback = verifyCallback;
