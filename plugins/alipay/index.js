const log4js = require('log4js');
const logger = log4js.getLogger('alipay');
const cron = appRequire('init/cron');
const config = appRequire('services/config').all();
const alipayf2f = require('alipay-ftof');
const fs = require('fs');
const ref = appRequire('plugins/webgui_ref/time');
const orderPlugin = appRequire('plugins/webgui_order');
const groupPlugin = appRequire('plugins/group');

let alipay_f2f;
if(config.plugins.alipay && config.plugins.alipay.use) {
  try {
    const privateKey = fs.readFileSync(config.plugins.alipay.merchantPrivateKey, 'utf8').toString();
    config.plugins.alipay.merchantPrivateKey = privateKey
    .replace(/-----BEGIN RSA PRIVATE KEY-----/, '')
    .replace(/-----END RSA PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  } catch (err) {}
  try {
    const publicKey = fs.readFileSync(config.plugins.alipay.alipayPublicKey, 'utf8').toString();
    config.plugins.alipay.alipayPublicKey = publicKey
    .replace(/-----BEGIN PUBLIC KEY-----/, '')
    .replace(/-----END PUBLIC KEY-----/, '')
    .replace(/\n/g, '');
  } catch (err) {}
  alipay_f2f = new alipayf2f({
    appid: config.plugins.alipay.appid,
    notifyUrl: config.plugins.alipay.notifyUrl,
    merchantPrivateKey: '-----BEGIN RSA PRIVATE KEY-----\n' + config.plugins.alipay.merchantPrivateKey + '\n-----END RSA PRIVATE KEY-----',
    alipayPublicKey: '-----BEGIN PUBLIC KEY-----\n' + config.plugins.alipay.alipayPublicKey + '\n-----END PUBLIC KEY-----',
    gatewayUrl: config.plugins.alipay.gatewayUrl,
  });
}

const isTelegram = config.plugins.webgui_telegram && config.plugins.webgui_telegram.use;
let telegram;
if(isTelegram) {
  telegram = appRequire('plugins/webgui_telegram/admin');
}

const knex = appRequire('init/knex').knex;
const account = appRequire('plugins/account/index');
const moment = require('moment');
const push = appRequire('plugins/webgui/server/push');

const createOrder = async (user, account, orderId) => {
  const oldOrder = await knex('alipay').where({
    user,
    account: account ? account : null,
    orderType: orderId
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
  const orderInfo = await orderPlugin.getOneOrder(orderId);
  if(+orderInfo.alipay <= 0) { return Promise.reject('amount error'); }
  const userInfo = await knex('user').where({ id: user }).then(s => s[0]);
  const groupInfo = await groupPlugin.getOneGroup(userInfo.group);
  if(groupInfo.order) {
    if(JSON.parse(groupInfo.order).indexOf(orderInfo.id) < 0) {
      return Promise.reject('invalid order');
    }
  }
  const myOrderId = moment().format('YYYYMMDDHHmmss') + Math.random().toString().substr(2, 6);
  const time = 60;
  const qrCode = await alipay_f2f.createQRPay({
    tradeNo: myOrderId,
    subject: orderInfo.name || 'ss续费',
    totalAmount: +orderInfo.alipay,
    body: orderInfo.name || 'ss续费',
    timeExpress: 10,
  });
  await knex('alipay').insert({
    orderId: myOrderId,
    orderType: orderId,
    qrcode: qrCode.qr_code,
    amount: orderInfo.alipay + '',
    user,
    account: account ? account : null,
    status: 'CREATE',
    createTime: Date.now(),
    expireTime: Date.now() + time * 60 * 1000,
  });
  logger.info(`创建订单: [${ myOrderId }][${ orderInfo.alipay }][account: ${ account }]`);
  return {
    orderId: myOrderId,
    qrCode: qrCode.qr_code,
  };
};

const sendSuccessMail = async userId => {
  const emailPlugin = appRequire('plugins/email/index');
  const user = await knex('user').select().where({
    type: 'normal',
    id: userId,
  }).then(success => {
    if(success.length) {
      return success[0];
    }
    return Promise.reject('user not found');
  });
  const orderMail = await knex('webguiSetting').select().where({
    key: 'mail',
  }).then(success => {
    if(!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value.order;
  });
  await emailPlugin.sendMail(user.email, orderMail.title, orderMail.content);
};

cron.minute(async () => {
  logger.info('check alipay order');
  if(!alipay_f2f) { return; }
  const orders = await knex('alipay').select().whereNotBetween('expireTime', [0, Date.now()]);
  const scanOrder = order => {
    logger.info(`order: [${ order.orderId }]`);
    if(order.status !== 'TRADE_SUCCESS' && order.status !== 'FINISH') {
      return alipay_f2f.checkInvoiceStatus(order.orderId).then(success => {
        if(success.code === '10000') {
          return knex('alipay').update({
            status: success.trade_status
          }).where({
            orderId: order.orderId,
          });
        }
      });
    } else if(order.status === 'TRADE_SUCCESS') {
      const accountId = order.account;
      const userId = order.user;
      push.pushMessage('支付成功', {
        body: `订单[ ${ order.orderId } ][ ${ order.amount } ]支付成功`,
      });
      isTelegram && telegram.push(`订单[ ${ order.orderId } ][ ${ order.amount } ]支付成功`);
      return account.setAccountLimit(userId, accountId, order.orderType)
      .then(() => {
        return knex('alipay').update({
          status: 'FINISH',
        }).where({
          orderId: order.orderId,
        });
      }).then(() => {
        logger.info(`订单支付成功: [${ order.orderId }][${ order.amount }][account: ${ accountId }]`);
        ref.payWithRef(userId, order.orderType);
        sendSuccessMail(userId);
      }).catch(err => {
        logger.error(`订单支付失败: [${ order.orderId }]`, err);
      });
    };
  };
  for(const order of orders) {
    await scanOrder(order);
  }
}, 'CheckAlipayOrder', 1);

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
  const group = options.group;
  const filter = options.filter || [];
  const sort = options.sort || 'alipay.createTime_desc';
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const start = options.start ? moment(options.start).hour(0).minute(0).second(0).millisecond(0).toDate().getTime() : moment(0).toDate().getTime();
  const end = options.end ? moment(options.end).hour(23).minute(59).second(59).millisecond(999).toDate().getTime() : moment().toDate().getTime();

  let count = knex('alipay').select().whereBetween('alipay.createTime', [start, end]);
  let orders = knex('alipay').select([
    'alipay.orderId',
    'alipay.orderType',
    'webgui_order.name as orderName',
    'user.id as userId',
    'user.group as group',
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
  .leftJoin('webgui_order', 'webgui_order.id', 'alipay.orderType')
  .whereBetween('alipay.createTime', [start, end]);

  if(filter.length) {
    count = count.whereIn('alipay.status', filter);
    orders = orders.whereIn('alipay.status', filter);
  }
  if(group >= 0) {
    count = count.leftJoin('user', 'user.id', 'alipay.user').where({ 'user.group': group });
    orders = orders.where({ 'user.group': group });
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

const getCsvOrder = async (options = {}) => {
  const search = options.search || '';
  const group = options.group;
  const filter = options.filter || [];
  const sort = options.sort || 'alipay.createTime_desc';
  const start = options.start ? moment(options.start).hour(0).minute(0).second(0).millisecond(0).toDate().getTime() : moment(0).toDate().getTime();
  const end = options.end ? moment(options.end).hour(23).minute(59).second(59).millisecond(999).toDate().getTime() : moment().toDate().getTime();

  let orders = knex('alipay').select([
    'alipay.orderId',
    'alipay.orderType',
    'user.id as userId',
    'user.group as group',
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
  .whereBetween('alipay.createTime', [start, end]);

  if(filter.length) {
    orders = orders.whereIn('alipay.status', filter);
  }
  if(group >= 0) {
    orders = orders.where({ 'user.group': group });
  }
  if(search) {
    orders = orders.where('alipay.orderId', 'like', `%${ search }%`);
  }

  orders = await orders.orderBy(sort.split('_')[0], sort.split('_')[1]);
  orders.forEach(f => {
    f.alipayData = JSON.parse(f.alipayData);
  });
  return orders;
};

const getUserFinishOrder = async userId => {
  let orders = await knex('alipay').select([
    'orderId',
    'amount',
    'createTime',
  ]).where({
    user: userId,
    status: 'FINISH',
  }).orderBy('createTime', 'DESC');
  orders = orders.map(order => {
    return {
      orderId: order.orderId,
      type: '支付宝',
      amount: order.amount,
      createTime: order.createTime,
    };
  });
  return orders;
};

const refund = async (orderId, amount) => {
  const order = await knex('alipay').where({ orderId }).then(s => s[0]);
  if(!order) { return Promise.reject('order not found'); }
  let refundAmount = order.amount;
  if(amount) { refundAmount = amount; }
  const result = await alipay_f2f.refund(order.orderId, {
    refundNo: moment().format('YYYYMMDDHHmmss') + Math.random().toString().substr(2, 6),
    refundAmount,
  });
  return result;
};

cron.minute(async () => {
  if(!alipay_f2f) { return; }
  await knex('alipay').delete().where({ status: 'CREATE' }).whereBetween('createTime', [0, Date.now() - 1 * 24 * 3600 * 1000]);
}, 'DeleteAlipayOrder', 53);

exports.orderListAndPaging = orderListAndPaging;
exports.orderList = orderList;
exports.createOrder = createOrder;
exports.checkOrder = checkOrder;
exports.verifyCallback = verifyCallback;
exports.getCsvOrder = getCsvOrder;
exports.getUserFinishOrder = getUserFinishOrder;
exports.refund = refund;
