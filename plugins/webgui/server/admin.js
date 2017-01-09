'use strict';

const manager = appRequire('services/manager');
const serverManager = appRequire('plugins/flowSaver/server');
const account = appRequire('plugins/account/index');
const flow = appRequire('plugins/flowSaver/flow');
const user = appRequire('plugins/user/index');
const knex = appRequire('init/knex').knex;
const moment = require('moment');

exports.getServers = (req, res) => {
  knex('server').select().then(success => {
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
    console.log(success);
    const name = req.body.name;
    const address = req.body.address;
    const port = +req.body.port;
    const password = req.body.password;
    return serverManager.add(name, address, port, password);
  }).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getAccount = (req, res) => {
  account.getAccount().then(success => {
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
      return account.addAccount(type, {
        port, password, time, limit, flow,
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
  }).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getServerFlow = (req, res) => {
  const serverId = req.params.serverId;
  const type = req.query.type;
  const time = req.query.time || Date.now();
  let timeArray = [];
  if(Array.isArray(time)) {
    timeArray = time;
  } else if(type === 'day') {
    let i = 0;
    while(i < 25) {
      timeArray.push(moment(time).hour(i).minute(0).second(0).millisecond(0).toDate().valueOf());
      i++;
    }
  } else if (type === 'hour') {
    let i = 0;
    while(i < 13) {
      timeArray.push(moment(time).minute(i * 5).second(0).millisecond(0).toDate().valueOf());
      i++;
    }
  } else if (type === 'week') {
    let i = 0;
    while(i < 8) {
      timeArray.push(moment(time).day(i).minute(0).second(0).millisecond(0).toDate().valueOf());
      i++;
    }
  }
  flow.getServerFlow(serverId, timeArray).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getUsers = (req, res) => {
  user.get().then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getOneUser = (req, res) => {
  const userId = req.params.userId;
  user.getOne(userId).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.userGetAccount = (req, res) => {
  account.getAccount().then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};
