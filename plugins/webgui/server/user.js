const user = appRequire('plugins/user/index');
const account = appRequire('plugins/account/index');
const flow = appRequire('plugins/flowSaver/flow');
const knex = appRequire('init/knex').knex;
const emailPlugin = appRequire('plugins/email/index');
const config = appRequire('services/config').all();
const giftcard = appRequire('plugins/giftcard');
const log4js = require('log4js');
const logger = log4js.getLogger('webgui');
const ref = appRequire('plugins/webgui_ref/index');
const refUser = appRequire('plugins/webgui_ref/user');

const alipay = appRequire('plugins/alipay/index');

exports.getAccount = (req, res) => {
  const userId = req.session.user;
  account.getAccount({
    userId,
  }).then(success => {
    success.forEach(f => {
      f.data = JSON.parse(f.data);
      if (f.type >= 2 && f.type <= 5) {
        const time = {
          '2': 7 * 24 * 3600000,
          '3': 30 * 24 * 3600000,
          '4': 24 * 3600000,
          '5': 3600000,
        };
        f.data.expire = f.data.create + f.data.limit * time[f.type];
        f.data.from = f.data.create;
        f.data.to = f.data.create + time[f.type];
        while (f.data.to <= Date.now()) {
          f.data.from = f.data.to;
          f.data.to = f.data.from + time[f.type];
        }
      }
      f.server = f.server ? JSON.parse(f.server) : f.server;
    });
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(500).end();
  });
};

exports.getOneAccount = (req, res) => {
  const userId = req.session.user;
  const accountId = +req.params.accountId;
  account.getAccount({
    id: accountId,
    userId,
  }).then(success => {
    if (!success.length) {
      res.send({});
      return;
    }
    const accountInfo = success[0];
    accountInfo.data = JSON.parse(accountInfo.data);
    if (accountInfo.type >= 2 && accountInfo.type <= 5) {
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
    }
    res.send(accountInfo);
  }).catch(err => {
    console.log(err);
    res.status(500).end();
  });;
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
  knex('server').select(['id', 'host', 'name', 'method', 'scale', 'comment', 'shift']).orderBy('name')
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
      return flow.getServerPortFlow(serverId, accountId, timeArray, account.multiServerFlow);
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
  const password = req.body.password;
  if (!password) { return res.status(403).end(); }
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

exports.createOrder = (req, res) => {
  const userId = req.session.user;
  const accountId = req.body.accountId;
  const orderType = req.body.orderType;
  let type;
  let amount;
  if (orderType === 'week') { type = 2; }
  else if (orderType === 'month') { type = 3; }
  else if (orderType === 'day') { type = 4; }
  else if (orderType === 'hour') { type = 5; }
  else if (orderType === 'season') { type = 6; }
  else if (orderType === 'year') { type = 7; }
  else { return res.status(403).end(); }
  knex('webguiSetting').select().where({
    key: 'payment',
  }).then(success => {
    if (!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value;
  }).then(success => {
    amount = success[orderType].alipay;
    return alipay.createOrder(userId, accountId, amount, type);
  }).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
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

exports.getPrice = (req, res) => {
  const price = {
    alipay: {},
    paypal: {},
  };
  knex('webguiSetting').select().where({
    key: 'payment',
  }).then(success => {
    if (!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value;
  }).then(success => {
    for (const s in success) {
      price.alipay[s] = success[s].alipay;
      price.paypal[s] = success[s].paypal;
    }
    return res.send(price);
  }).catch(() => {
    res.status(403).end();
  });
};

exports.getNotice = async (req, res) => {
  try {
    const userId = req.session.user;
    const groupInfo = await knex('user').select([
      'group.id as id',
      'group.showNotice as showNotice',
    ]).innerJoin('group', 'user.group', 'group.id').where({
      'user.id': userId,
    }).then(s => s[0]);
    const group = [groupInfo.id];
    if(groupInfo.showNotice) { group.push(-1); }
    const notices = await knex('notice').select().whereIn('group', group).orderBy('time', 'desc');
    return res.send(notices);
  } catch (err) {
    console.log(err);
    res.status(403).end();
  }
  
  
  // knex('notice').select().orderBy('time', 'desc').then(success => {
  //   return res.send(success);
  // }).catch(err => {
  //   console.log(err);
  //   res.status(403).end();
  // });
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

exports.createPaypalOrder = (req, res) => {
  const userId = req.session.user;
  const accountId = req.body.accountId;
  const orderType = req.body.orderType;
  let type;
  let amount;
  if (orderType === 'week') { type = 2; }
  else if (orderType === 'month') { type = 3; }
  else if (orderType === 'day') { type = 4; }
  else if (orderType === 'hour') { type = 5; }
  else if (orderType === 'season') { type = 6; }
  else if (orderType === 'year') { type = 7; }
  else { return res.status(403).end(); }
  // amount = config.plugins.account.pay[orderType].price;
  knex('webguiSetting').select().where({
    key: 'payment',
  }).then(success => {
    if (!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value;
  }).then(success => {
    amount = success[orderType].paypal;
    return paypal.createOrder(userId, accountId, amount, type);
  }).then(success => {
    res.send(success);
  })
    .catch(error => {
      res.status(403).end();
    });
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

exports.payByGiftCard = async (req, resp) => {
  const password = req.body.password;
  const userId = +req.session.user;
  const accountId = req.body.accountId ? +req.body.accountId : null;
  if (!userId) {
    resp.status(400).end();
    return;
  }
  try {
    const result = await giftcard.processOrder(userId, accountId, password);
    resp.send(result);
  } catch (err) {
    logger.error(`使用充值码时出现错误：${err.toString()}`);
    resp.status(500).end();
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