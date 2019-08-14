const manager = appRequire('services/manager');
const serverManager = appRequire('plugins/flowSaver/server');
const account = appRequire('plugins/account/index');
const flow = appRequire('plugins/flowSaver/flow');
const user = appRequire('plugins/user/index');
const knex = appRequire('init/knex').knex;
const alipay = appRequire('plugins/alipay/index');
const paypal = appRequire('plugins/paypal/index');
const email = appRequire('plugins/email/index');
const config = appRequire('services/config').all();
const isAlipayUse = config.plugins.alipay && config.plugins.alipay.use;
const isPaypalUse = config.plugins.paypal && config.plugins.paypal.use;
const rp = require('request-promise');
const macAccount = appRequire('plugins/macAccount/index');
const refOrder = appRequire('plugins/webgui_ref/order');
const refUser = appRequire('plugins/webgui_ref/user');
const flowPack = appRequire('plugins/webgui_order/flowPack');
const accountFlow = appRequire('plugins/account/accountFlow');

exports.getAccount = (req, res) => {
  const group = req.adminInfo.id === 1 ? -1 : req.adminInfo.group;
  account.getAccount({ group }).then(success => {
    success.forEach(account => {
      account.data = JSON.parse(account.data);
      if(account.type >= 2 && account.type <= 5) {
        const time = {
          '2': 7 * 24 * 3600000,
          '3': 30 * 24 * 3600000,
          '4': 24 * 3600000,
          '5': 3600000,
        };
        account.data.expire = account.data.create + account.data.limit * time[account.type];
        account.data.from = account.data.create;
        account.data.to = account.data.create + time[account.type];
        while(account.data.to <= Date.now()) {
          account.data.from = account.data.to;
          account.data.to = account.data.from + time[account.type];
        }
      }
    });
    success.sort((a, b) => {
      return a.port >= b.port ? 1 : -1;
    });
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getOnlineAccount = (req, res) => {
  const serverId = req.query.serverId ? +req.query.serverId : 0;
  account.getOnlineAccount(serverId).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getAccountByPort = async (req, res) => {
  try {
    const port = +req.params.port;
    const accountInfo = await account.getAccount({ port }).then(s => s[0]);
    if(!accountInfo) { return Promise.reject('account not found'); }
    if(accountInfo.data) {
      accountInfo.data = JSON.parse(accountInfo.data);
    }
    res.send(accountInfo);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getOneAccount = async (req, res) => {
  try {
    const accountId = +req.params.accountId;
    const accountInfo = await account.getAccount({ id: accountId }).then(s => s[0]);
    if(!accountInfo) {
      return Promise.reject('account not found');
    }
    accountInfo.data = JSON.parse(accountInfo.data);
    if(accountInfo.type >= 2 && accountInfo.type <= 5) {
      const time = {
        '2': 7 * 24 * 3600000,
        '3': 30 * 24 * 3600000,
        '4': 24 * 3600000,
        '5': 3600000,
      };
      accountInfo.data.expire = accountInfo.data.create + accountInfo.data.limit * time[accountInfo.type];
      accountInfo.data.from = accountInfo.data.create;
      accountInfo.data.to = accountInfo.data.create + time[accountInfo.type];
      while(accountInfo.data.to <= Date.now()) {
        accountInfo.data.from = accountInfo.data.to;
        accountInfo.data.to = accountInfo.data.from + time[accountInfo.type];
      }
      accountInfo.server = accountInfo.server ? JSON.parse(accountInfo.server) : accountInfo.server;
      accountInfo.data.flowPack = await flowPack.getFlowPack(accountId, accountInfo.data.from, accountInfo.data.to);
    }
    accountInfo.publicKey = '';
    accountInfo.privateKey = '';
    if(accountInfo.key) {
      if(accountInfo.key.includes(':')) {
        accountInfo.publicKey = accountInfo.key.split(':')[0];
        accountInfo.privateKey = accountInfo.key.split(':')[1];
      } else {
        accountInfo.publicKey = accountInfo.key;
      }
    }
    await accountFlow.edit(accountInfo.id);
    return res.send(accountInfo);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  };
};

exports.addAccount = (req, res) => {
  req.checkBody('port', 'Invalid port').isInt({min: 1, max: 65535});
  req.checkBody('password', 'Invalid password').notEmpty();
  req.checkBody('time', 'Invalid time').notEmpty();
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const type = +req.body.type;
      const orderId = +req.body.orderId;
      const port = +req.body.port;
      const password = req.body.password;
      const time = req.body.time;
      const limit = +req.body.limit;
      const flow = +req.body.flow;
      const autoRemove = +req.body.autoRemove || 0;
      const autoRemoveDelay = +req.body.autoRemoveDelay || 0;
      const multiServerFlow = +req.body.multiServerFlow || 0;
      const server = req.body.server ? JSON.stringify(req.body.server) : null;
      const user = req.body.user || null;
      return account.addAccount(type, {
        port, password, time, limit, flow, autoRemove, autoRemoveDelay, server, multiServerFlow, orderId,
        user,
      });
    }
    result.throw();
  }).then(success => {
    res.send({ id: success });
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.deleteAccount = (req, res) => {
  const accountId = req.params.accountId;
  account.delAccount(accountId).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.changeAccountPort = (req, res) => {
  req.checkBody('port', 'Invalid port').isInt({min: 1, max: 65535});
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const accountId = req.params.accountId;
      const port = +req.body.port;
      return account.changePort(accountId, port);
    }
    result.throw();
  }).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.changeAccountData = (req, res) => {
  const accountId = req.params.accountId;
  account.editAccount(accountId, {
    type: req.body.type,
    orderId: req.body.orderId,
    port: req.body.port,
    password: req.body.password,
    time: req.body.time,
    limit: +req.body.limit,
    flow: +req.body.flow,
    autoRemove: +req.body.autoRemove,
    autoRemoveDelay: +req.body.autoRemoveDelay,
    multiServerFlow: +req.body.multiServerFlow,
    server: req.body.server,
    active: 1,
  }).then(success => {
    if(req.body.cleanFlow) {
      flow.cleanAccountFlow(accountId);
    }
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.changeAccountTime = (req, res) => {
  const accountId = req.params.accountId;
  const time = req.body.time;
  const check = req.body.check;
  account.editAccountTime(accountId, time, check).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getRecentSignUpUsers = (req, res) => {
  const group = req.adminInfo.id === 1 ? -1 : req.adminInfo.group;
  user.getRecentSignUp(5, group).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getRecentLoginUsers = (req, res) => {
  const group = req.adminInfo.id === 1 ? -1 : req.adminInfo.group;
  user.getRecentLogin(5, group).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getRecentOrders = (req, res) => {
  if(!isAlipayUse) {
    return res.send([]);
  }
  const group = req.adminInfo.id === 1 ? -1 : req.adminInfo.group;
  alipay.orderListAndPaging({
    pageSize: 5,
    group,
  }).then(success => {
    return res.send(success.orders);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getPaypalRecentOrders = (req, res) => {
  if(!isPaypalUse) {
    return res.send([]);
  }
  const group = req.adminInfo.id === 1 ? -1 : req.adminInfo.group;
  paypal.orderListAndPaging({
    pageSize: 5,
    group,
  }).then(success => {
    return res.send(success.orders);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.deleteUser = (req, res) => {
  const userId = req.params.userId;
  user.delete(userId).then(success => {
    return res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getUserAccount = (req, res) => {
  account.getAccount().then(success => {
    success = success.filter(f => {
      return !f.userId;
    });
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.setUserAccount = (req, res) => {
  const userId = req.params.userId;
  const accountId = req.params.accountId;
  account.editAccount(accountId, { userId }).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.deleteUserAccount = (req, res) => {
  const userId = req.params.userId;
  const accountId = req.params.accountId;
  macAccount.getAccountByAccountId(accountId).then(macAccounts => {
    if(macAccounts.length) {
      return res.status(403).end();
    }
    return account.editAccount(accountId, { userId: null });
  }).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getUserOrders = (req, res) => {
  if(!isAlipayUse) {
    return res.send([]);
  }
  const options = {
    userId: +req.params.userId,
  };
  alipay.orderList(options)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getUserRefOrders = (req, res) => {
  const userId = +req.params.userId;
  refOrder.getUserOrders(userId)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getPaypalUserOrders = (req, res) => {
  if(!isPaypalUse) {
    return res.send([]);
  }
  const options = {
    userId: +req.params.userId,
  };
  paypal.orderList(options)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getOrders = (req, res) => {
  if(!isAlipayUse) {
    return res.send({
      maxPage: 0,
      page: 1,
      pageSize: 0,
      total: 0,
      orders: [],
    });
  }
  const options = {};
  if(req.adminInfo.id === 1) {
    options.group = +req.query.group;
  } else {
    options.group = req.adminInfo.group;
  }
  options.page = +req.query.page || 1;
  options.pageSize = +req.query.pageSize || 20;
  options.search = req.query.search || '';
  options.sort = req.query.sort || 'alipay.createTime_desc';
  options.start = req.query.start;
  options.end = req.query.end;
  
  options.filter = ( Array.isArray(req.query.filter) ? req.query.filter : [req.query.filter] ) || [];
  alipay.orderListAndPaging(options)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getCsvOrders = async (req, res) => {
  const options = {};
  if(req.adminInfo.id === 1) {
    options.group = +req.query.group;
  } else {
    options.group = req.adminInfo.group;
  }
  options.search = req.query.search || '';
  options.sort = req.query.sort || 'alipay.createTime_desc';
  options.start = req.query.start;
  options.end = req.query.end;

  options.filter = ( Array.isArray(req.query.filter) ? req.query.filter : [req.query.filter] ) || [];
  alipay.getCsvOrder(options)
  .then(success => {
    res.setHeader('Content-disposition', 'attachment; filename=download.csv');
    res.setHeader('Content-type', 'text/csv');
    res.send(success.map(m => {
      return `${ m.orderId }, ${ m.amount }, ${ m.username }`;
    }).join('\r\n'));
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getRefOrders = (req, res) => {
  const options = {};
  if(req.adminInfo.id === 1) {
    options.group = +req.query.group;
  } else {
    options.group = req.adminInfo.group;
  }
  options.page = +req.query.page || 1;
  options.pageSize = +req.query.pageSize || 20;
  options.search = req.query.search || '';
  options.sort = req.query.sort || 'webgui_ref_time.createTime_desc';
  options.start = req.query.start;
  options.end = req.query.end;
  
  options.filter = req.query.filter || '';
  refOrder.orderListAndPaging(options)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getPaypalOrders = (req, res) => {
  if(!isPaypalUse) {
    return res.send({
      maxPage: 0,
      page: 1,
      pageSize: 0,
      total: 0,
      orders: [],
    });
  }
  const options = {};
  if(req.adminInfo.id === 1) {
    options.group = +req.query.group;
  } else {
    options.group = req.adminInfo.group;
  }
  options.page = +req.query.page || 1;
  options.pageSize = +req.query.pageSize || 20;
  options.search = req.query.search || '';
  options.sort = req.query.sort || 'paypal.createTime_desc';
  options.start = req.query.start;
  options.end = req.query.end;

  options.filter = req.query.filter || '';
  paypal.orderListAndPaging(options)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getPaypalCsvOrders = async (req, res) => {
  res.send('PP');
};

exports.getUserPortLastConnect = (req, res) => {
  const accountId = +req.params.accountId;
  flow.getUserPortLastConnect(accountId).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.sendUserEmail = (req, res) => {
  const userId = +req.params.userId;
  const title = req.body.title;
  const content = req.body.content;
  req.checkBody('title', 'Invalid title').notEmpty();
  req.checkBody('content', 'Invalid content').notEmpty();
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      return user.getOne(userId).then(user => user.email);
    }
    result.throw();
  }).then(emailAddress => {
    return email.sendMail(emailAddress, title, content, {
      type: 'user',
    });
  }).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getAccountIp = (req, res) => {
  const accountId = +req.params.accountId;
  const serverId = +req.params.serverId;
  let serverInfo;
  knex('server').select().where({
    id: serverId,
  }).then(success => {
    if(success.length) {
      serverInfo = success[0];
    } else {
      return Promise.reject('server not found');
    }
    return account.getAccount({ id: accountId }).then(success => success[0]);
  }).then(accountInfo => {
    const port = accountInfo.port;
    return manager.send({
      command: 'ip',
      port: port + serverInfo.shift,
    }, {
      host: serverInfo.host,
      port: serverInfo.port,
      password: serverInfo.password,
    });
  }).then(ip => {
    return res.send({ ip });
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getAccountIpFromAllServer = (req, res) => {
  const accountId = +req.params.accountId;
  let accountInfo;
  account.getAccount({ id: accountId }).then(success => {
    accountInfo = success[0];
    return knex('server').select().where({});
  }).then(servers => {
    const getIp = (port, serverInfo) => {
      return manager.send({
        command: 'ip',
        port: port + serverInfo.shift,
      }, {
        host: serverInfo.host,
        port: serverInfo.port,
        password: serverInfo.password,
      });
    };
    const promiseArray = servers.map(server => {
      return getIp(accountInfo.port, server).catch(err => []);
    });
    return Promise.all(promiseArray);
  }).then(ips => {
    const result = [];
    ips.forEach(ip => {
      ip.forEach(i => {
        if(result.indexOf(i) < 0) { result.push(i); }
      });
    });
    return res.send({ ip: result });
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getAccountIpInfo = (req, res) => {
  const ip = req.params.ip;

  const taobao = ip => {
    const uri = `http://ip.taobao.com/service/getIpInfo.php?ip=${ ip }`;
    return rp({ uri, timeout: 10 * 1000 }).then(success => {
      const decode = (s) => {
        return unescape(s.replace(/\\u/g, '%u'));
      };
      return JSON.parse(decode(success));
    }).then(success => {
      if(success.code !== 0) {
        return Promise.reject(success.code);
      }
      const result = [success.data.region + (success.data.region === success.data.city ? '' : success.data.city), success.data.isp];
      return result;
    });
  };

  const sina = ip => {
    const uri = `https://int.dpool.sina.com.cn/iplookup/iplookup.php?format=js&ip=${ ip }`;
    return rp({ uri, timeout: 10 * 1000 }).then(success => {
      const decode = (s) => {
        return unescape(s.replace(/\\u/g, '%u'));
      };
      return JSON.parse(decode(success.match(/^var remote_ip_info = ([\s\S]+);$/)[1]));
    }).then(success => {
      const result = [success.province + success.city, success.isp];
      return result;
    });
  };

  const ipip = ip => {
    const uri = `https://freeapi.ipip.net/${ ip }`;
    return rp({ uri, timeout: 10 * 1000 }).then(success => {
      const decode = (s) => {
        return unescape(s.replace(/\\u/g, '%u'));
      };
      return JSON.parse(decode(success));
    }).then(success => {
      const result = [success[1] + success[2], success[4]];
      return result;
    });
  };

  const getIpFunction = ip => {
    return taobao(ip).catch(() => {
      return sina(ip);
    }).catch(() => {
      return ipip(ip);
    });
  };
  getIpFunction(ip)
  .then(success => {
    return res.send(success);
  }).catch(err => {
    return res.send(['', '']);
  });
};

exports.getAllMacAccount = (req, res) => {
  const group = req.adminInfo.id === 1 ? -1 : req.adminInfo.group;
  macAccount.getAllAccount(group).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.resetAccountFlow = (req, res) => {
  const accountId = +req.params.accountId;
  flow.cleanAccountFlow(accountId).then(success => {
    return res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.newPortForAddAccount = async (req, res) => {
  try {
    let newPort;
    const port = await knex('webguiSetting').select().where({
      key: 'account',
    }).then(success => {
      if(!success.length) { return Promise.reject('settings not found'); }
      success[0].value = JSON.parse(success[0].value);
      return success[0].value.port;
    });
    if(port.random) {
      const getRandomPort = () => Math.floor(Math.random() * (port.end - port.start + 1) + port.start);
      let retry = 0;
      let myPort = getRandomPort();
      const checkIfPortExists = port => {
        let myPort = port;
        return knex('account_plugin').select()
        .where({ port }).then(success => {
          if(success.length && retry <= 30) {
            retry++;
            myPort = getRandomPort();
            return checkIfPortExists(myPort);
          } else if (success.length && retry > 30) {
            return Promise.reject('Can not get a random port');
          } else {
            return myPort;
          }
        });
      };
      newPort = await checkIfPortExists(myPort);
    } else {
      newPort = await knex('account_plugin').select()
      .whereBetween('port', [port.start, port.end])
      .orderBy('port', 'ASC').then(success => {
        const portArray = success.map(m => m.port);
        let myPort;
        for(let p = port.start; p <= port.end; p++) {
          if(portArray.indexOf(p) < 0) {
            myPort = p; break;
          }
        }
        if(myPort) {
          return myPort;
        } else {
          return Promise.reject('no port');
        }
      });
    }
    res.send({ port: newPort });
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getRefUserById = (req, res) => {
  const userId = +req.params.userId;
  refUser.getRefUser(userId).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getRefCodeById = (req, res) => {
  const userId = +req.params.userId;
  refUser.getRefCode(userId)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.addRefCodeForUser = async (req, res) => {
  try {
    const userId = +req.params.userId;
    const number = req.body.number;
    const max = req.body.max;
    for(let i = 0; i < number; i++) {
      await refUser.addRefCode(userId, max);
    }
    res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.deleteRefCode = async (req ,res) => {
  try {
    const code = req.params.code;
    await refUser.deleteRefCode(code);
    res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.deleteRefUser = async (req, res) => {
  try {
    const sourceUserId = +req.params.sourceUserId;
    const refUserId = +req.params.refUserId;
    await refUser.deleteRefUser(sourceUserId, refUserId);
    res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.alipayRefund = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const amount = req.body.amount;
    const result = await alipay.refund(orderId, amount);
    res.send(result);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getAccountAndPaging = async (req, res) => {
  try {
    const page = +req.body.page || 1;
    const pageSize = +req.body.pageSize || 20;
    const sort = req.body.sort;
    const search = req.body.search || '';
    const filter = req.body.filter;
    const accounts = await account.getAccountAndPaging({
      page,
      pageSize,
      search,
      sort,
      filter,
    });
    return res.send(accounts);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};
