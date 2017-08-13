const macAccount = appRequire('plugins/macAccount/index');

exports.getMacAccount = (req, res) => {
  const userId = +req.query.userId;
  macAccount.getAccount(userId).then(success => {
    res.send(success);
  });
};
exports.addMacAccount = (req, res) => {
  const mac = req.params.macAddress;
  const userId = req.body.userId;
  const accountId = req.body.accountId;
  const serverId = req.body.serverId;
  macAccount.newAccount(mac, userId, serverId, accountId).then(success => {
    res.send('success');
  });
};
exports.editMacAccount = (req, res) => {
  const id = req.body.id;
  const mac = req.body.macAddress;
  const userId = req.body.userId;
  const accountId = req.body.accountId;
  const serverId = req.body.serverId;
  macAccount.editAccount(id, mac, serverId, accountId).then(success => {
    res.send('success');
  });
};

exports.deleteMacAccount = (req, res) => {
  const accountId = +req.query.id;
  macAccount.deleteAccount(accountId).then(success => {
    res.send('success');
  });
};

exports.getMacAccountForUser = (req, res) => {
  const mac = req.params.macAddress;
  macAccount.getAccountForUser(mac).then(success => {
    res.send(success);
  });
};