'use strict';

const config = appRequire('services/config').all();

const checkPassword = (req, res) => {
  const password = req.body.password;
  if(password === config.plugins.freeAccount.managerPassword) {
    req.session.isManager = true;
    req.session.save();
    return res.send('success');
  }
  req.session.destroy();
  res.status(401).end();
};

exports.checkPassword = checkPassword;
