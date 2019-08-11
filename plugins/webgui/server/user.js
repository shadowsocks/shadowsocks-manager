const user = appRequire('plugins/user/index');
const account = appRequire('plugins/account/index');
const flow = appRequire('plugins/flowSaver/flow');
const moment = require('moment');
const knex = appRequire('init/knex').knex;
const emailPlugin = appRequire('plugins/email/index');
const orderPlugin = appRequire('plugins/webgui_order');
const groupPlugin = appRequire('plugins/group');
const config = appRequire('services/config').all();
const giftcard = appRequire('plugins/giftcard');
const log4js = require('log4js');
const logger = log4js.getLogger('webgui');
const ref = appRequire('plugins/webgui_ref/index');
const refUser = appRequire('plugins/webgui_ref/user');
const refOrder = appRequire('plugins/webgui_ref/order');
const crypto = require('crypto');
const flowPack = appRequire('plugins/webgui_order/flowPack');
const alipayPlugin = appRequire('plugins/alipay/index');
const macAccountPlugin = appRequire('plugins/macAccount/index');
const accountFlow = appRequire('plugins/account/accountFlow');

const alipay = appRequire('plugins/alipay/index');

exports.getAccount = async (req, res) => {
  try {
    const userId = req.session.user;
    const accounts = await account.getAccount({ userId });
    for(const account of accounts) {
      account.data = JSON.parse(account.data);
      if (account.type >= 2 && account.type <= 5) {
        const time = {
          '2': 7 * 24 * 3600000,
          '3': 30 * 24 * 3600000,
          '4': 24 * 3600000,
          '5': 3600000,
        };
        account.data.expire = account.data.create + account.data.limit * time[account.type];
        account.data.from = account.data.create;
        account.data.to = account.data.create + time[account.type];
        while (account.data.to <= Date.now()) {
          account.data.from = account.data.to;
          account.data.to = account.data.from + time[account.type];
        }
        account.data.flowPack = await flowPack.getFlowPack(account.id, account.data.from, account.data.to);
      }
      account.server = account.server ? JSON.parse(account.server) : account.server;
      account.publicKey = '';
      account.privateKey = '';
      if(account.key) {
        if(account.key.includes(':')) {
          account.publicKey = account.key.split(':')[0];
          account.privateKey = account.key.split(':')[1];
        } else {
          account.publicKey = account.key;
        }
      }
      await accountFlow.edit(account.id);
    }
    res.send(accounts);
  } catch (err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getAccountUsage = async (req, res) => {
  try {
    const userId = req.session.user;
    const accounts = await account.getAccount({ userId });
    const servers = await knex('server').where({}).then(s => s.map(m => m.id));
    const day = [
      moment().hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(),
      moment().hour(24).minute(0).second(0).millisecond(0).toDate().valueOf(),
    ];
    const week = [
      moment().day(0).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(),
      moment().day(7).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(),
    ];
    const month = [
      moment().date(0).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(),
      moment().date(31).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf(),
    ];
    const dayFlow = await Promise.all(accounts.map(m => {
      return flow.getServerPortFlowWithScale(null, m.id, day, true).then(s => s[0]);
    })).then(s => s.reduce((a, b) => a + b, 0));
    const weekFlow = await Promise.all(accounts.map(m => {
      return flow.getServerPortFlowWithScale(null, m.id, week, true).then(s => s[0]);
    })).then(s => s.reduce((a, b) => a + b, 0));
    const monthFlow = await Promise.all(accounts.map(m => {
      return flow.getServerPortFlowWithScale(null, m.id, month, true).then(s => s[0]);
    })).then(s => s.reduce((a, b) => a + b, 0));
    res.send([dayFlow, weekFlow, monthFlow]);
  } catch (err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getOneAccount = async (req, res) => {
  try {
    const userId = req.session.user;
    const accountId = +req.params.accountId;
    const accountInfo = account.getAccount({ id: accountId, userId }).then(s => s[0]);
    if(!accountInfo) { return Promise.reject('account not found'); }
    if (accountInfo.type >= 2 && accountInfo.type <= 5) {
      accountInfo.data = JSON.parse(accountInfo.data);
      const time = {
        '2': 7 * 24 * 3600000,
        '3': 30 * 24 * 3600000,
        '4': 24 * 3600000,
        '5': 3600000,
      };
      accountInfo.data.expire = accountInfo.data.create + accountInfo.data.limit * time[accountInfo.type];
      accountInfo.data.from = accountInfo.data.create;
      accountInfo.data.to = accountInfo.data.create + time[accountInfo.type];
      while (accountInfo.data.to <= Date.now()) {
        accountInfo.data.from = accountInfo.data.to;
        accountInfo.data.to = accountInfo.data.from + time[accountInfo.type];
      }
      accountInfo.server = accountInfo.server ? JSON.parse(accountInfo.server) : accountInfo.server;
      accountInfo.data.flowPack = await flowPack.getFlowPack(accountId, accountInfo.data.from, accountInfo.data.to);
    }
    res.send(accountInfo);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getServers = (req, res) => {
  const userId = req.session.user;
  const serverAliasFilter = servers => {
    return servers.map(server => {
      if(server.host.indexOf(':') >= 0) {
        const hosts = server.host.split(':');
        const number = Math.ceil(Math.random() * (hosts.length - 1));
        server.host = hosts[number];
      }
      return server;
    });
  };
  let servers;
  knex('server').select(['id', 'type' ,'host', 'name', 'method', 'scale', 'comment', 'shift', 'key', 'net', 'wgPort']).orderBy('name')
    .then(success => {
      servers = serverAliasFilter(success);
      return account.getAccount({
        userId,
      }).then(accounts => {
        return accounts.map(f => {
          f.server = f.server ? JSON.parse(f.server) : f.server;
          return f;
        });
      });
    })
    .then(success => {
      if (!success.length) {
        return res.send([]);
      }
      const isAll = success.some(account => {
        if (!account.server) { return true; }
      });
      if (isAll) {
        return res.send(servers);
      } else {
        let accountArray = [];
        success.forEach(account => {
          account.server.forEach(s => {
            if (accountArray.indexOf(s) < 0) {
              accountArray.push(s);
            }
          });
        });
        return res.send(servers.filter(f => {
          return accountArray.indexOf(f.id) >= 0;
        }));
      }
    }).catch(err => {
      console.log(err);
      res.status(500).end();
    });
};

exports.getServerPortFlow = (req, res) => {
  const serverId = +req.params.serverId;
  const accountId = +req.params.accountId;
  let account = null;
  knex('account_plugin').select().where({
    id: accountId,
  }).then(success => {
    if (!success.length) {
      return Promise.reject('account not found');
    }
    account = success[0];
    account.data = JSON.parse(account.data);
    const time = {
      '2': 7 * 24 * 3600000,
      '3': 30 * 24 * 3600000,
      '4': 24 * 3600000,
      '5': 3600000,
    };
    if (account.type >= 2 && account.type <= 5) {
      const timeArray = [account.data.create, account.data.create + time[account.type]];
      if (account.data.create <= Date.now()) {
        let i = 0;
        while (account.data.create + i * time[account.type] <= Date.now()) {
          timeArray[0] = account.data.create + i * time[account.type];
          timeArray[1] = account.data.create + (i + 1) * time[account.type];
          i++;
        }
      }
      return flow.getServerPortFlowWithScale(serverId, accountId, timeArray, account.multiServerFlow);
    } else {
      return [0];
    }
  }).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getServerPortLastConnect = (req, res) => {
  const serverId = +req.params.serverId;
  const accountId = +req.params.accountId;
  flow.getlastConnectTime(serverId, accountId)
    .then(success => {
      res.send(success);
    }).catch(err => {
      console.log(err);
      res.status(403).end();
    });
};

exports.changeShadowsocksPassword = (req, res) => {
  const accountId = +req.params.accountId;
  let password = req.body.password;
  if (!password) { return res.status(403).end(); }
  if (password.length > 20) { password = password.substr(0, 20); }
  const isUserHasTheAccount = (accountId) => {
    return account.getAccount({ userId: req.session.user, id: accountId }).then(success => {
      if (success.length) {
        return;
      }
      return Promise.reject();
    });
  };
  isUserHasTheAccount(accountId).then(() => {
    return account.changePassword(accountId, password);
  }).then(() => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.createOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const accountId = req.body.accountId;
    const orderId = req.body.orderId;

    const alipayOrder = await alipay.createOrder(userId, accountId, orderId);
    return res.send(alipayOrder);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.checkOrder = (req, res) => {
  const orderId = req.body.orderId;
  alipay.checkOrder(orderId).then(success => {
    return res.send({ status: success });
  }).catch(() => {
    res.status(403).end();
  });
};

exports.alipayCallback = (req, res) => {
  const signStatus = alipay.verifyCallback(req.body);
  if (signStatus === false) {
    return res.send('error');
  }
  return res.send('success');
};

exports.getPrice = async (req, res) => {
  try {
    const accountId = +req.query.accountId;
    let accountInfo;
    let changeOrderTypeId = 0;
    let orderInfo;
    const isExpired = account => {
      if(!account) { return true; }
      const accountData = JSON.parse(account.data);
      const time = {
        '2': 7 * 24 * 3600000,
        '3': 30 * 24 * 3600000,
        '4': 24 * 3600000,
        '5': 3600000,
      };
      const expire = accountData.create + time[account.type] * accountData.limit;
      return expire <= Date.now();
    };
    if(accountId) {
      orderInfo = await orderPlugin.getOneOrderByAccountId(accountId);
      accountInfo = await knex('account_plugin').where({ id: accountId }).then(s => s[0]);
      if(orderInfo && !orderInfo.changeOrderType) {
        changeOrderTypeId = orderInfo.id;
      }
    }
    const groupId = req.userInfo.group;
    let orders = await orderPlugin.getOrders();
    const groupSetting = await groupPlugin.getOneGroup(groupId);
    if(groupSetting.order) {
      orders = orders.filter(f => {
        return JSON.parse(groupSetting.order).indexOf(f.id) >= 0;
      });
      if(orderInfo) {
        orders = orders.filter(f => {
          if(!f.baseId) { return true; }
          if(f.baseId === orderInfo.id && !isExpired(accountInfo)) { return true; }
          return false;
        });
      } else {
        orders = orders.filter(f => !f.baseId);
      }
    }
    let currentOrder = [];
    if(changeOrderTypeId && !isExpired(accountInfo)) {
      currentOrder = orders.filter(f => {
        return (f.id === changeOrderTypeId || f.baseId === changeOrderTypeId);
      });
    }
    return res.send(currentOrder.length ? currentOrder : orders);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getNotice = async (req, res) => {
  try {
    const userId = req.session.user;
    const noticesWithoutGroup = await knex('notice').where({ group: 0 });
    const noticesWithGroup = await knex('notice').select([
      'notice.id as id',
      'notice.title as title',
      'notice.content as content',
      'notice.time as time',
      'notice.group as group',
      'notice.autopop as autopop',
    ])
    .innerJoin('notice_group', 'notice.id', 'notice_group.noticeId')
    .innerJoin('user', 'user.group', 'notice_group.groupId')
    .where('notice.group', '>', 0)
    .where({ 'user.id': userId })
    .groupBy('notice.id');
    const notices = [...noticesWithoutGroup, ...noticesWithGroup ].sort((a, b) => b.time - a.time);
    return res.send(notices);
  } catch (err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getAlipayStatus = (req, res) => {
  return res.send({
    status: config.plugins.alipay && config.plugins.alipay.use,
  });
};

exports.getMultiServerFlowStatus = (req, res) => {
  knex('webguiSetting').select().where({
    key: 'account',
  }).then(success => {
    if (!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0];
  }).then(success => {
    return res.send({ status: success.value.multiServerFlow });
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

const paypal = appRequire('plugins/paypal/index');

exports.createPaypalOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const accountId = req.body.accountId;
    const orderId = req.body.orderId;
    const paypalOrder = await paypal.createOrder(userId, accountId, orderId);
    return res.send(paypalOrder);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.executePaypalOrder = (req, res) => {
  paypal.executeOrder(req.body)
    .then(success => {
      res.send(success);
    })
    .catch(error => {
      res.status(403).end();
    });
};

exports.paypalCallback = (req, res) => {
  console.log(req.body);
  return res.send('success');
};

exports.changePassword = (req, res) => {
  const oldPassword = req.body.password;
  const newPassword = req.body.newPassword;
  if (!oldPassword || !newPassword) {
    return res.status(403).end();
  }
  const userId = req.session.user;
  user.changePassword(userId, oldPassword, newPassword).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getTelegramCode = (req, res) => {
  const telegramUser = appRequire('plugins/webgui_telegram/user');
  const userId = req.session.user;
  telegramUser.getCode(userId).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.unbindTelegram = (req, res) => {
  const telegramUser = appRequire('plugins/webgui_telegram/user');
  const userId = req.session.user;
  telegramUser.unbindUser(userId).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.payByGiftCard = async (req, res) => {
  const password = req.body.password;
  const userId = +req.session.user;
  const accountId = req.body.accountId ? +req.body.accountId : null;
  if (!userId) {
    res.status(400).end();
    return;
  }
  try {
    const checkGiftcardType = async () => {
      let accountInfo;
      let changeOrderTypeId = 0;
      let orderInfo;
      const isExpired = account => {
        if(!account) { return true; }
        const accountData = JSON.parse(account.data);
        const time = {
          '2': 7 * 24 * 3600000,
          '3': 30 * 24 * 3600000,
          '4': 24 * 3600000,
          '5': 3600000,
        };
        const expire = accountData.create + time[account.type] * accountData.limit;
        return expire <= Date.now();
      };
      if(accountId) {
        orderInfo = await orderPlugin.getOneOrderByAccountId(accountId);
        accountInfo = await knex('account_plugin').where({ id: accountId }).then(s => s[0]);
        if(orderInfo && !orderInfo.changeOrderType) {
          changeOrderTypeId = orderInfo.id;
        }
      }
      const groupId = req.userInfo.group;
      let orders = await orderPlugin.getOrders();
      const groupSetting = await groupPlugin.getOneGroup(groupId);
      if(groupSetting.order) {
        orders = orders.filter(f => {
          return JSON.parse(groupSetting.order).indexOf(f.id) >= 0;
        });
        if(orderInfo) {
          orders = orders.filter(f => {
            if(!f.baseId) { return true; }
            if(f.baseId === orderInfo.id && !isExpired(accountInfo)) { return true; }
            return false;
          });
        } else {
          orders = orders.filter(f => !f.baseId);
        }
      }
      let currentOrder = [];
      if(changeOrderTypeId && !isExpired(accountInfo)) {
        currentOrder = orders.filter(f => {
          return (f.id === changeOrderTypeId || f.baseId === changeOrderTypeId);
        });
      }
      // return res.send(currentOrder.length ? currentOrder : orders);
      const giftCardInfo = await knex('giftcard').where({ password }).then(s => s[0]);
      const validTypes = currentOrder.length ? currentOrder.map(m => m.id) : orders.map(m => m.id);
      return validTypes.indexOf(giftCardInfo.orderType) < 0;

      // if(!accountId) { return false; }
      // const orderInfo = await orderPlugin.getOneOrderByAccountId(accountId);
      // if(!orderInfo || orderInfo.changeOrderType) { return false; }
      // const changeOrderTypeId = orderInfo.id;
      // const accountInfo = await knex('account_plugin').where({ id: accountId }).then(s => s[0]);
      // const groupId = req.userInfo.group;
      // let orders = await orderPlugin.getOrders();
      // const groupSetting = await groupPlugin.getOneGroup(groupId);
      // if(groupSetting.order) {
      //   orders = orders.filter(f => {
      //     return JSON.parse(groupSetting.order).indexOf(f.id) >= 0;
      //   });
      // }
      // let currentOrder = [];
      // const isExpired = account => {
      //   if(!account) { return true; }
      //   const accountData = JSON.parse(account.data);
      //   const time = {
      //     '2': 7 * 24 * 3600000,
      //     '3': 30 * 24 * 3600000,
      //     '4': 24 * 3600000,
      //     '5': 3600000,
      //   };
      //   const expire = accountData.create + time[account.type] * accountData.limit;
      //   return expire <= Date.now();
      // };
      // if(changeOrderTypeId && !isExpired(accountInfo)) {
      //   currentOrder = orders.filter(f => {
      //     return f.id === changeOrderTypeId;
      //   });
      // }
      // const giftCardInfo = await knex('giftcard').where({ password }).then(s => s[0]);
      // if(currentOrder.length && giftCardInfo) {
      //   if(giftCardInfo.orderType !== currentOrder[0].id) {
      //     return true;
      //   }
      // }
      // return false;
    };
    
    if(await checkGiftcardType()) {
      return res.send({ success: false, message: '充值码类型错误' });
    };
    const result = await giftcard.processOrder(userId, accountId, password);
    res.send(result);
  } catch (err) {
    logger.error(`使用充值码时出现错误：${err.toString()}`);
    res.status(500).end();
  }
};

exports.getRefCode = (req, res) => {
  const userId = +req.session.user;
  refUser.getRefCode(userId).then(success => {
    const result = success.filter(f => {
      return f.count < f.maxUser;
    });
    res.send(result);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getRefUser = (req, res) => {
  const userId = +req.session.user;
  refUser.getRefUser(userId).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getAccountSubscribe = async (req, res) => {
  try {
    const userId = req.session.user;
    const accountId = +req.params.accountId;
    const account = await knex('account_plugin').select([
      'id',
      'subscribe'
    ]).where({
      id: accountId,
      userId,
    }).then(s => s[0]);
    if(!account.subscribe) {
      const subscribeToken = crypto.randomBytes(16).toString('hex');;
      await await knex('account_plugin').update({
        subscribe: subscribeToken
      }).where({
        id: accountId,
        userId,
      });
      account.subscribe = subscribeToken;
    }
    res.send(account);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.updateAccountSubscribe = async (req, res) => {
  try {
    const userId = req.session.user;
    const accountId = +req.params.accountId;
    const account = await knex('account_plugin').select([
      'id',
      'subscribe'
    ]).where({
      id: accountId,
      userId,
    }).then(s => s[0]);
    if(!account) { return Promise.reject('account not found'); }
    const subscribeToken = crypto.randomBytes(16).toString('hex');;
    await await knex('account_plugin').update({
      subscribe: subscribeToken
    }).where({
      id: accountId,
      userId,
    });
    account.subscribe = subscribeToken;
    res.send(account);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.activeAccount = async (req, res) => {
  try {
    const userId = req.session.user;
    const accountId = +req.params.accountId;
    const accountInfo = await account.getAccount({ id: accountId, userId }).then(s => s[0]);
    if(!accountInfo) { return Promise.reject('account not found'); }
    await account.activeAccount(accountInfo.id);
    res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    let orders = [];

    if(config.plugins.alipay && config.plugins.alipay.use) {
      const alipayOrders = await alipayPlugin.getUserFinishOrder(userId);
      orders = [...orders, ...alipayOrders];
    }

    if(config.plugins.paypal && config.plugins.paypal.use) {
      const paypalOrders = await paypal.getUserFinishOrder(userId);
      orders = [...orders, ...paypalOrders];
    }

    const refOrders = await refOrder.getUserFinishOrder(userId);
    orders = [...orders, ...refOrders];

    if(config.plugins.giftcard && config.plugins.giftcard.use) {
      const giftCardOrders = await giftcard.getUserFinishOrder(userId);
      orders = [...orders, ...giftCardOrders];
    }

    orders = orders.sort((a, b) => {
      return b.createTime - a.createTime;
    });
    res.send(orders);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getMacAccount = async (req, res) => {
  try {
    const userId = req.session.user;
    const accounts = await macAccountPlugin.getAccountByUserId(userId);
    res.send(accounts);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.addMacAccount = async (req, res) => {
  try {
    const userId = req.session.user;
    const { mac } = req.body;
    await macAccountPlugin.userAddMacAccount(userId, mac);
    res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};
