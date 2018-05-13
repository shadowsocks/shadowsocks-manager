const macAccount = appRequire('plugins/macAccount/index');
const account = appRequire('plugins/account/index');

const formatMacAddress = mac => {
  return mac.replace(/-/g, '').replace(/:/g, '').toLowerCase();
};

exports.getMacAccount = (req, res) => {
  const userId = +req.query.userId;
  macAccount.getAccount(userId, -1).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.addMacAccount = (req, res) => {
  const mac = formatMacAddress(req.params.macAddress);
  const userId = req.body.userId;
  const accountId = req.body.accountId;
  const serverId = req.body.serverId;
  macAccount.newAccount(mac, userId, serverId, accountId).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.editMacAccount = (req, res) => {
  const id = req.body.id;
  const mac = formatMacAddress(req.body.macAddress);
  const userId = req.body.userId;
  const accountId = req.body.accountId;
  const serverId = req.body.serverId;
  macAccount.editAccount(id, mac, serverId, accountId).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.deleteMacAccount = (req, res) => {
  const accountId = +req.query.id;
  macAccount.deleteAccount(accountId).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getMacAccountForUser = (req, res) => {
  const mac = req.params.macAddress;
  const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
  const noPassword = !!(+req.query.noPassword);
  const noFlow = !!(+req.query.noFlow);
  macAccount.getAccountForUser(mac.toLowerCase(), ip, {
    noPassword,
    noFlow,
  }).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getNoticeForUser = (req, res) => {
  const mac = req.params.macAddress;
  const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
  macAccount
  .getNoticeForUser(mac.toLowerCase(), ip)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.banAccount = (req, res) => {
  const serverId = +req.params.serverId;
  const accountId = +req.params.accountId;
  const time = +req.body.time;
  account.banAccount({
    serverId,
    accountId,
    time,
  }).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getBanAccount = (req, res) => {
  const serverId = +req.params.serverId;
  const accountId = +req.params.accountId;
  account.getBanAccount({
    serverId,
    accountId,
  }).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};