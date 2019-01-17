const log4js = require('log4js');
const logger = log4js.getLogger('paypal');
const knex = appRequire('init/knex').knex;
const cron = appRequire('init/cron');
const paypal = require('paypal-rest-sdk');
const account = appRequire('plugins/account/index');
const moment = require('moment');
const push = appRequire('plugins/webgui/server/push');
const config = appRequire('services/config').all();
const ref = appRequire('plugins/webgui_ref/time');
const orderPlugin = appRequire('plugins/webgui_order');
const groupPlugin = appRequire('plugins/group');

if(config.plugins.paypal && config.plugins.paypal.use) {
  paypal.configure({
    mode: config.plugins.paypal.mode,
    client_id: config.plugins.paypal.client_id,
    client_secret: config.plugins.paypal.client_secret,
  });
}

const createOrder = async (user, account, orderId) => {
  try {
    const orderInfo = await orderPlugin.getOneOrder(orderId);
    if(+orderInfo.paypal <= 0) { return Promise.reject('amount error'); }
    const userInfo = await knex('user').where({ id: user }).then(s => s[0]);
    const groupInfo = await groupPlugin.getOneGroup(userInfo.group);
    if(groupInfo.order) {
      if(JSON.parse(groupInfo.order).indexOf(orderInfo.id) < 0) {
        return Promise.reject('invalid order');
      }
    }
    const create_payment_json = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: config.plugins.webgui.site + '/user/account',
        cancel_url: config.plugins.webgui.site + '/user/account',
      },
      transactions: [{
        amount: {
          currency: 'USD',
          total: orderInfo.paypal,
        },
        description: orderInfo.name || 'ss'
      }]
    };
    const payment = await new Promise((resolve, reject) => {
      paypal.payment.create(JSON.stringify(create_payment_json), function (error, payment) {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          resolve(payment);
        }
      });
    });
    const myOrderId = moment().format('YYYYMMDDHHmmss') + Math.random().toString().substr(2, 6);
    await knex('paypal').insert({
      orderId: myOrderId,
      paypalId: payment.id,
      orderType: orderId,
      amount: orderInfo.paypal + '',
      user,
      account: (account !== 'undefined' && account) ? account : null,
      status: 'created',
      createTime: Date.now(),
      expireTime: Date.now() + 2 * 60 * 60 * 1000,
    });
    return { paymentID: payment.id };
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};

const executeOrder = async (order) => {
  const orderInfo = await new Promise((resolve, reject) => {
    paypal.payment.get(order.paymentID, function (error, payment) {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        resolve(payment);
      }
    });
  });
  const execute_payment_json = {
    payer_id: orderInfo.payer.payer_info.payer_id,
    transactions: [{
      amount: orderInfo.transactions[0].amount,
    }]
  };
  return new Promise((resolve, reject) => {
    paypal.payment.execute(order.paymentID, JSON.stringify(execute_payment_json), function (error, payment) {
      if (error) {
        console.log(error);
        return reject(error);
      } else {
        return resolve();
      }
    });
  });
};

exports.createOrder = createOrder;
exports.executeOrder = executeOrder;

const checkOrder = async paypalId => {
  const orderInfo = await new Promise((resolve, reject) => {
    paypal.payment.get(paypalId, function (error, payment) {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        resolve(payment);
      }
    });
  });
  await knex('paypal').update({ status: orderInfo.state, paypalData: JSON.stringify(orderInfo) }).where({ paypalId });
  return;
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
  if(!config.plugins.paypal || !config.plugins.paypal.use) { return; }
  const orders = await knex('paypal').select().whereNotBetween('expireTime', [0, Date.now()]);
  const scanOrder = order => {
    if(order.status !== 'approved' && order.status !== 'finish') {
      return checkOrder(order.paypalId);
    } else if(order.status === 'approved') {
      const accountId = order.account;
      const userId = order.user;
      push.pushMessage('支付成功', {
        body: `订单[ ${ order.orderId } ][ ${ order.amount } ]支付成功`,
      });
      return checkOrder(order.paypalId).then(() => {
        return account.setAccountLimit(userId, accountId, order.orderType);
      }).then(() => {
        return knex('paypal').update({
          status: 'finish',
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
}, 'CheckPaypalOrder', 1);

const orderList = async (options = {}) => {
  const where = {};
  if(options.userId) {
    where['user.id'] = options.userId;
  }
  const orders = await knex('paypal').select([
    'paypal.orderId',
    'paypal.orderType',
    'user.id as userId',
    'user.username',
    'account_plugin.port',
    'paypal.amount',
    'paypal.status',
    'paypal.paypalData',
    'paypal.createTime',
    'paypal.expireTime',
  ])
  .leftJoin('user', 'user.id', 'paypal.user')
  .leftJoin('account_plugin', 'account_plugin.id', 'paypal.account')
  .where(where)
  .orderBy('paypal.createTime', 'DESC');
  orders.forEach(f => {
    f.paypalData = JSON.parse(f.paypalData);
  });
  return orders;
};

const orderListAndPaging = async (options = {}) => {
  const search = options.search || '';
  const group = options.group;
  const filter = options.filter || [];
  const sort = options.sort || 'paypal.createTime_desc';
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const start = options.start ? moment(options.start).hour(0).minute(0).second(0).millisecond(0).toDate().getTime() : moment(0).toDate().getTime();
  const end = options.end ? moment(options.end).hour(23).minute(59).second(59).millisecond(999).toDate().getTime() : moment().toDate().getTime();

  let count = knex('paypal').select().whereBetween('paypal.createTime', [start, end]);
  let orders = knex('paypal').select([
    'paypal.orderId',
    'paypal.orderType',
    'user.id as userId',
    'user.username',
    'account_plugin.port',
    'paypal.amount',
    'paypal.status',
    'paypal.paypalData',
    'paypal.createTime',
    'paypal.expireTime',
  ])
  .leftJoin('user', 'user.id', 'paypal.user')
  .leftJoin('account_plugin', 'account_plugin.id', 'paypal.account')
  .whereBetween('paypal.createTime', [start, end]);

  if(filter.length) {
    count = count.whereIn('paypal.status', filter);
    orders = orders.whereIn('paypal.status', filter);
  }
  if(group >= 0) {
    count = count.leftJoin('user', 'user.id', 'paypal.user').where({ 'user.group': group });
    orders = orders.where({ 'user.group': group });
  }
  if(search) {
    count = count.where('paypal.orderId', 'like', `%${ search }%`);
    orders = orders.where('paypal.orderId', 'like', `%${ search }%`);
  }

  count = await count.count('orderId as count').then(success => success[0].count);
  orders = await orders.orderBy(sort.split('_')[0], sort.split('_')[1]).limit(pageSize).offset((page - 1) * pageSize);
  orders.forEach(f => {
    f.paypalData = JSON.parse(f.paypalData);
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

const getUserFinishOrder = async userId => {
  let orders = await knex('paypal').select([
    'orderId',
    'amount',
    'createTime',
  ]).where({
    user: userId,
  }).orderBy('createTime', 'DESC');
  orders = orders.map(order => {
    return {
      orderId: order.orderId,
      type: 'Paypal',
      amount: order.amount,
      createTime: order.createTime,
    };
  });
  return orders;
};

exports.orderListAndPaging = orderListAndPaging;
exports.orderList = orderList;
exports.getUserFinishOrder = getUserFinishOrder;

cron.minute(() => {
  if(!config.plugins.paypal || !config.plugins.paypal.use) { return; }
  knex('paypal').delete().where({ status: 'created' }).whereBetween('expireTime', [0, Date.now() - 1 * 24 * 3600 * 1000]).then();
}, 'DeletePaypalOrder', 30);
