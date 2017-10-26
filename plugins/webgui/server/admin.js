const manager = appRequire('services/manager');
const serverManager = appRequire('plugins/flowSaver/server');
const account = appRequire('plugins/account/index');
const flow = appRequire('plugins/flowSaver/flow');
const user = appRequire('plugins/user/index');
const knex = appRequire('init/knex').knex;
const moment = require('moment');
const alipay = appRequire('plugins/alipay/index');
const paypal = appRequire('plugins/paypal/index');
const email = appRequire('plugins/email/index');
const config = appRequire('services/config').all();
const isAlipayUse = config.plugins.alipay && config.plugins.alipay.use;
const isPaypalUse = config.plugins.paypal && config.plugins.paypal.use;
const rp = require('request-promise');

exports.getAccount = (req, res) => {
  account.getAccount().then(success => {
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

exports.getAccountByPort = (req, res) => {
  const port = +req.params.port;
  account.getAccount({ port }).then(success => {
    if(success.length) {
      return success[0];
    }
    return Promise.reject('account not found');
  }).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getOneAccount = (req, res) => {
  const accountId = +req.params.accountId;
  account.getAccount({ id: accountId }).then(success => {
    const accountInfo = success[0];
    if(accountInfo) {
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
      }
      accountInfo.server = accountInfo.server ? JSON.parse(accountInfo.server) : accountInfo.server;
      return res.send(accountInfo);
    }
    return res.status(403).end();
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.addAccount = (req, res) => {
  req.checkBody('port', 'Invalid port').isInt({min: 1, max: 65535});
  req.checkBody('password', 'Invalid password').notEmpty();
  req.checkBody('time', 'Invalid time').notEmpty();
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const type = +req.body.type;
      const port = +req.body.port;
      const password = req.body.password;
      const time = req.body.time;
      const limit = +req.body.limit;
      const flow = +req.body.flow;
      const autoRemove = +req.body.autoRemove || 0;
      return account.addAccount(type, {
        port, password, time, limit, flow, autoRemove,
      });
    }
    result.throw();
  }).then(success => {
    res.send('success');
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
    port: +req.body.port,
    password: req.body.password,
    time: req.body.time,
    limit: +req.body.limit,
    flow: +req.body.flow,
    autoRemove: +req.body.autoRemove,
    server: req.body.server,
  }).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getRecentSignUpUsers = (req, res) => {
  user.getRecentSignUp(5).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getRecentLoginUsers = (req, res) => {
  user.getRecentLogin(5).then(success => {
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
  alipay.orderListAndPaging({
    pageSize: 5,
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
  paypal.orderListAndPaging({
    pageSize: 5,
  }).then(success => {
    return res.send(success.orders);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getOneUser = (req, res) => {
  const userId = req.params.userId;
  let userInfo = null;
  user.getOne(userId).then(success => {
    userInfo = success;
    return account.getAccount();
  }).then(success => {
    userInfo.account = success.filter(f => {
      return f.userId === +userId;
    });
    return res.send(userInfo);
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
  account.editAccount(accountId, { userId: null }).then(success => {
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
  options.page = +req.query.page || 1;
  options.pageSize = +req.query.pageSize || 20;
  options.search = req.query.search || '';
  options.sort = req.query.sort || 'alipay.createTime_desc';
  options.filter = req.query.filter || '';
  alipay.orderListAndPaging(options)
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
  options.page = +req.query.page || 1;
  options.pageSize = +req.query.pageSize || 20;
  options.search = req.query.search || '';
  options.sort = req.query.sort || 'paypal.createTime_desc';
  options.filter = req.query.filter || '';
  paypal.orderListAndPaging(options)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
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
      const result = [success.data.region + success.data.city, success.data.isp];
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