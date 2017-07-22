const log4js = require('log4js');
const logger = log4js.getLogger('paypal');
const knex = appRequire('init/knex').knex;
const cron = appRequire('init/cron');
const paypal = require('paypal-rest-sdk');
const account = appRequire('plugins/account/index');
const moment = require('moment');
const push = appRequire('plugins/webgui/server/push');
const config = appRequire('services/config').all();
paypal.configure({
  mode: config.plugins.paypal.mode,
  client_id: config.plugins.paypal.client_id,
  client_secret: config.plugins.paypal.client_secret,
});

const createOrder = async (user, account, amount, type) => {
  // const amountUsd = (amount / +config.plugins.paypal.rate).toFixed(2);
  try {
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
          currency: "USD",
          total: amount,
        },
        description: "ss"
      }]
    };
    const payment = await new Promise((resolve, reject) => {
      paypal.payment.create(JSON.stringify(create_payment_json), function (error, payment) {
        if (error) {
          console.log(error);
          reject(error);
        } else {
          // console.log("Create Payment Response");
          // console.log(payment);
          resolve(payment);
        }
      });
    });
    const orderId = moment().format('YYYYMMDDHHmmss') + Math.random().toString().substr(2, 6);
    await knex('paypal').insert({
      orderId,
      paypalId: payment.id,
      orderType: type,
      amount: amount + '',
      user,
      account: (account !== 'undefined' && account) ? account : null,
      status: 'create',
      createTime: Date.now(),
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
        // console.log("Get Payment Response");
        // console.log(JSON.stringify(payment, null, 2));
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
      //   console.log("Get Payment Response");
      //   console.log(JSON.stringify(payment));
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
  await knex('paypal').update({ status: orderInfo.state }).where({ paypalId });
  return;
};

cron.minute(async () => {
  const orders = await knex('paypal').select();
  const scanOrder = order => {
    if(order.status !== 'approved' && order.status !== 'finish') {
      return checkOrder(order.paypalId);
    } else if(order.status === 'approved') {
      const accountId = order.account;
      const userId = order.user;
      push.pushMessage('支付成功', {
        body: `订单[ ${ order.orderId } ][ ${ order.amount } ]支付成功`,
      });
      return account.setAccountLimit(userId, accountId, order.orderType)
      .then(() => {
        return knex('paypal').update({
          status: 'finish',
        }).where({
          orderId: order.orderId,
        });
      }).then(() => {
        logger.info(`订单支付成功: [${ order.orderId }][${ order.amount }][account: ${ accountId }]`);
      }).catch(err => {
        logger.error(`订单支付失败: [${ order.orderId }]`, err);
      });
    };
  };
  for(const order of orders) {
    await scanOrder(order);
  }
}, 1);