'use strict';

const config = appRequire('services/config').all();

const isManager = (req, res, next) => {
  if(req.session.isManager) {
    return next();
  }
  res.status(401).end();
};

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

const getConfig = (req, res) => {
  
};

exports.checkPassword = checkPassword;
exports.isManager = isManager;
exports.getConfig = getConfig;
