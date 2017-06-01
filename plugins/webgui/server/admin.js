const manager = appRequire('services/manager');
const serverManager = appRequire('plugins/flowSaver/server');
const account = appRequire('plugins/account/index');
const flow = appRequire('plugins/flowSaver/flow');
const user = appRequire('plugins/user/index');
const knex = appRequire('init/knex').knex;
const moment = require('moment');
const alipay = appRequire('plugins/alipay/index');

exports.getServers = (req, res) => {
  serverManager.list().then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(500).end();
  });
};

exports.getOneServer = (req, res) => {
  const serverId = req.params.serverId;
  let result = null;
  knex('server').select().where({
    id: +serverId,
  }).then(success => {
    if(success.length) {
      result = success[0];
      return manager.send({
        command: 'list',
      }, {
        host: success[0].host,
        port: success[0].port,
        password: success[0].password,
      });
    }
    res.status(404).end();
  }).then(success => {
    result.ports = success;
    res.send(result);
  }).catch(err => {
    console.log(err);
    res.status(500).end();
  });
};

exports.addServer = (req, res) => {
  req.checkBody('name', 'Invalid name').notEmpty();
  req.checkBody('address', 'Invalid address').notEmpty();
  req.checkBody('port', 'Invalid port').isInt({min: 1, max: 65535});
  req.checkBody('password', 'Invalid password').notEmpty();
  req.checkBody('method', 'Invalid method').notEmpty();
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const address = req.body.address;
      const port = +req.body.port;
      const password = req.body.password;
      return manager.send({
        command: 'flow',
        options: { clear: false, },
      }, {
        host: address,
        port,
        password,
      });
    }
    result.throw();
  }).then(success => {
    const name = req.body.name;
    const address = req.body.address;
    const port = +req.body.port;
    const password = req.body.password;
    const method = req.body.method;
    return serverManager.add(name, address, port, password, method);
  }).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.editServer = (req, res) => {
  req.checkBody('name', 'Invalid name').notEmpty();
  req.checkBody('address', 'Invalid address').notEmpty();
  req.checkBody('port', 'Invalid port').isInt({min: 1, max: 65535});
  req.checkBody('password', 'Invalid password').notEmpty();
  req.checkBody('method', 'Invalid method').notEmpty();
  req.checkBody('scale', 'Invalid scale').notEmpty();
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const address = req.body.address;
      const port = +req.body.port;
      const password = req.body.password;
      return manager.send({
        command: 'flow',
        options: { clear: false, },
      }, {
        host: address,
        port,
        password,
      });
    }
    result.throw();
  }).then(success => {
    const serverId = req.params.serverId;
    const name = req.body.name;
    const address = req.body.address;
    const port = +req.body.port;
    const password = req.body.password;
    const method = req.body.method;
    const scale = req.body.scale;
    return serverManager.edit(serverId, name, address, port, password, method, scale);
  }).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.deleteServer = (req, res) => {
  const serverId = req.params.serverId;
  serverManager.del(serverId)
  .then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

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
  const accountId = req.params.accountId;
  account.getAccount().then(success => {
    const accountInfo = success.filter(f => {
      return f.id === +accountId;
    })[0];
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
    Promise.reject('account not found');
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

exports.getServerFlow = (req, res) => {
  const serverId = req.params.serverId;
  const port = req.query.port;
  const type = req.query.type;
  const time = req.query.time || Date.now();
  let timeArray = [];
  if(Array.isArray(time)) {
    timeArray = time.map(m => +m);
  } else if(type === 'day') {
    let i = 0;
    while(i < 25) {
      timeArray.push(moment(+time).hour(i).minute(0).second(0).millisecond(0).toDate().valueOf());
      i++;
    }
  } else if (type === 'hour') {
    let i = 0;
    while(i < 13) {
      timeArray.push(moment(+time).minute(i * 5).second(0).millisecond(0).toDate().valueOf());
      i++;
    }
  } else if (type === 'week') {
    let i = 0;
    while(i < 8) {
      timeArray.push(moment(+time).day(i).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf());
      i++;
    }
  }
  let getFlow;
  if(port) {
    getFlow = flow.getServerPortFlow(serverId, +port, timeArray);
  } else {
    getFlow = flow.getServerFlow(serverId, timeArray);
  }
  getFlow.then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getServerLastHourFlow = (req, res) => {
  const serverId = req.params.serverId;
  let timeArray = [];
  let i = 0;
  const now = Date.now();
  const time = moment(now).add(0 - (moment(now).minute() % 5), 'm').second(0).millisecond(0).toDate().valueOf();
  while(i < 13) {
    timeArray.push(moment(time).add(i * 5 - 60, 'm').toDate().valueOf());
    i++;
  }
  const timeRet = timeArray.map((time, index) => {
    return moment(time).minute();
  }).slice(0, 12);
  flow.getServerFlow(serverId, timeArray).then(success => {
    res.send({
      time: timeRet,
      flow: success,
    });
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getServerUserFlow = (req, res) => {
  const serverId = +req.params.serverId;
  const type = req.query.type;
  const time = +req.query.time || Date.now();
  let timeArray = [];
  if(Array.isArray(time)) {
    timeArray = time;
  } else if(type === 'day') {
    timeArray.push(moment(time).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf());
    timeArray.push(moment(time).hour(24).minute(0).second(0).millisecond(0).toDate().valueOf());
  } else if (type === 'hour') {
    timeArray.push(moment(time).minute(0).second(0).millisecond(0).toDate().valueOf());
    timeArray.push(moment(time).minute(60).second(0).millisecond(0).toDate().valueOf());
  } else if (type === 'week') {
    timeArray.push(moment(time).day(0).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf());
    timeArray.push(moment(time).day(7).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf());
  }
  flow.getServerUserFlow(serverId, timeArray).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getServerPortFlow = (req, res) => {
  const serverId = +req.params.serverId;
  const port = +req.params.port;
  let account = null;
  knex('account_plugin').select().where({
    port,
  }).then(success => {
    if(!success.length) {
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
    if(account.type >=2 && account.type <= 5) {
      const timeArray = [account.data.create, account.data.create + time[account.type]];
      if(account.data.create <= Date.now()) {
        let i = 0;
        while(account.data.create + i * time[account.type] <= Date.now()) {
          timeArray[0] = account.data.create + i * time[account.type];
          timeArray[1] = account.data.create + (i + 1) * time[account.type];
          i++;
        }
      }
      return knex('webguiSetting').select().where({ key: 'system' })
      .then(success => {
        if(!success.length) {
          return Promise.reject('settings not found');
        }
        success[0].value = JSON.parse(success[0].value);
        return success[0].value.multiServerFlow;
      }).then(isMultiServerFlow => {
        return flow.getServerPortFlow(serverId, port, timeArray, isMultiServerFlow);
      });
    } else {
      return [ 0 ];
    }
  }).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getAccountServerFlow = (req, res) => {
  const accountId = +req.params.accountId;
  const type = req.query.type;
  const time = +req.query.time || Date.now();
  let timeArray = [];
  if(Array.isArray(time)) {
    timeArray = time;
  } else if(type === 'day') {
    timeArray.push(moment(time).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf());
    timeArray.push(moment(time).hour(24).minute(0).second(0).millisecond(0).toDate().valueOf());
  } else if (type === 'hour') {
    timeArray.push(moment(time).minute(0).second(0).millisecond(0).toDate().valueOf());
    timeArray.push(moment(time).minute(60).second(0).millisecond(0).toDate().valueOf());
  } else if (type === 'week') {
    timeArray.push(moment(time).day(0).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf());
    timeArray.push(moment(time).day(7).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf());
  }
  flow.getAccountServerFlow(accountId, timeArray).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getUsers = (req, res) => {
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 20;
  const search = req.query.search || '';
  const sort = req.query.sort || 'id_asc';
  user.getUserAndPaging({
    page,
    pageSize,
    search,
    sort,
  }).then(success => {
    success.users = success.users.map(m => {
      return {
        id: m.id,
        email: m.email,
        lastLogin: m.lastLogin,
        username: m.username,
      };
    });
    return res.send(success);
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

exports.getServerPortLastConnect = (req, res) => {
  const serverId = +req.params.serverId;
  const port = +req.params.port;
  flow.getlastConnectTime(serverId, port)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getUserOrders = (req, res) => {
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

exports.getOrders = (req, res) => {
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

exports.getUserPortLastConnect = (req, res) => {
  const port = +req.params.port;
  flow.getUserPortLastConnect(port).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};