function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const log4js = require('log4js');
const logger = log4js.getLogger('alipay');

const config = appRequire('services/config').all();
const alipayf2f = require('alipay-ftof');
const alipay_f2f = new alipayf2f({
  appid: config.plugins.alipay.appid,
  notifyUrl: config.plugins.alipay.notifyUrl,
  merchantPrivateKey: '-----BEGIN RSA PRIVATE KEY-----\n' + config.plugins.alipay.merchantPrivateKey + '\n-----END RSA PRIVATE KEY-----',
  alipayPublicKey: '-----BEGIN PUBLIC KEY-----\n' + config.plugins.alipay.alipayPublicKey + '\n-----END PUBLIC KEY-----',
  gatewayUrl: config.plugins.alipay.gatewayUrl
});
const knex = appRequire('init/knex').knex;
const account = appRequire('plugins/account/index');
const moment = require('moment');
const push = appRequire('plugins/webgui/server/push');

const createOrder = (() => {
  var _ref = _asyncToGenerator(function* (user, account, amount, orderType = 3) {
    const oldOrder = yield knex('alipay').select().where({
      user,
      account: account ? account : null,
      amount: amount + '',
      orderType
    }).where('expireTime', '>', Date.now() + 15 * 60 * 1000).where({
      status: 'CREATE'
    }).then(function (success) {
      return success[0];
    });
    if (oldOrder) {
      return {
        orderId: oldOrder.orderId,
        qrCode: oldOrder.qrcode
      };
    }
    const orderId = moment().format('YYYYMMDDHHmmss') + Math.random().toString().substr(2, 6);
    const time = 60;
    const qrCode = yield alipay_f2f.createQRPay({
      tradeNo: orderId,
      subject: 'ss续费',
      totalAmount: +amount,
      body: 'ss',
      timeExpress: 10
    });
    yield knex('alipay').insert({
      orderId,
      orderType,
      qrcode: qrCode.qr_code,
      amount: amount + '',
      user,
      account: account ? account : null,
      status: 'CREATE',
      createTime: Date.now(),
      expireTime: Date.now() + time * 60 * 1000
    });
    logger.info(`创建订单: [${orderId}][${amount}][account: ${account}]`);
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
      const userId = order.user;
      push.pushMessage('支付成功', {
        body: `订单[ ${order.orderId} ]支付成功`
      });
      account.setAccountLimit(userId, accountId, order.orderType).then(function () {
        return knex('alipay').update({
          status: 'FINISH'
        }).where({
          orderId: order.orderId
        });
      }).then(function () {
        logger.info(`订单支付成功: [${order.orderId}][${amount}][account: ${account}]`);
      }).catch(function (err) {
        logger.error(`订单支付失败: [${orderId}]`, err);
      });
    };
  });
}), 60 * 1000);

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

const verifyCallback = data => {
  const signStatus = alipay_f2f.verifyCallback(data);
  if (signStatus) {
    knex('alipay').update({
      status: data.trade_status,
      alipayData: JSON.stringify(data)
    }).where({
      orderId: data.out_trade_no
    }).andWhereNot({
      status: 'FINISH'
    }).then();
  }
  return signStatus;
};

const orderList = (() => {
  var _ref4 = _asyncToGenerator(function* (options = {}) {
    const where = {};
    if (options.userId) {
      where['user.id'] = options.userId;
    }
    const orders = yield knex('alipay').select(['alipay.orderId', 'alipay.orderType', 'user.username', 'account_plugin.port', 'alipay.amount', 'alipay.status', 'alipay.alipayData', 'alipay.createTime', 'alipay.expireTime']).leftJoin('user', 'user.id', 'alipay.user').leftJoin('account_plugin', 'account_plugin.id', 'alipay.account').where(where).orderBy('alipay.createTime', 'DESC');
    orders.forEach(function (f) {
      f.alipayData = JSON.parse(f.alipayData);
    });
    return orders;
  });

  return function orderList() {
    return _ref4.apply(this, arguments);
  };
})();

const orderListAndPaging = (() => {
  var _ref5 = _asyncToGenerator(function* (options = {}) {
    const search = options.search || '';
    const filter = options.filter || [];
    const sort = options.sort || 'alipay.createTime_desc';
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;

    let count = knex('alipay').select();
    let orders = knex('alipay').select(['alipay.orderId', 'alipay.orderType', 'user.username', 'account_plugin.port', 'alipay.amount', 'alipay.status', 'alipay.alipayData', 'alipay.createTime', 'alipay.expireTime']).leftJoin('user', 'user.id', 'alipay.user').leftJoin('account_plugin', 'account_plugin.id', 'alipay.account');

    if (filter.length) {
      count = count.whereIn('alipay.status', filter);
      orders = orders.whereIn('alipay.status', filter);
    }

    count = yield count.count('orderId as count').then(function (success) {
      return success[0].count;
    });
    orders = yield orders.orderBy(sort.split('_')[0], sort.split('_')[1]).limit(pageSize).offset((page - 1) * pageSize);
    orders.forEach(function (f) {
      f.alipayData = JSON.parse(f.alipayData);
    });
    const maxPage = Math.ceil(count / pageSize);
    return {
      total: count,
      page,
      maxPage,
      pageSize,
      orders
    };
  });

  return function orderListAndPaging() {
    return _ref5.apply(this, arguments);
  };
})();

exports.orderListAndPaging = orderListAndPaging;
exports.orderList = orderList;
exports.createOrder = createOrder;
exports.checkOrder = checkOrder;
exports.verifyCallback = verifyCallback;