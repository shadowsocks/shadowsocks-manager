const macAccount = appRequire('plugins/macAccount/index');

exports.getMacAccount = (req, res) => {};
exports.addMacAccount = (req, res) => {};
exports.editMacAccount = (req, res) => {};
exports.deleteMacAccount = (req, res) => {};

exports.getMacAccountForUser = (req, res) => {
  const mac = req.params.macAddress;
  macAccount.getAccount(mac).then(success => {
    res.send(success);
  });
};