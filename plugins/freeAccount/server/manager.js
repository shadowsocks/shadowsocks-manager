'use strict';

const config = appRequire('services/config').all();
const knex = appRequire('init/knex').knex;

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
  res.status(403).end();
};

const logout = (req, res) => {
  req.session.destroy();
  res.send('success');
};

const getConfig = (req, res) => {
  const shadowsocks = config.plugins.freeAccount.shadowsocks;
  const limit = config.plugins.freeAccount.limit;
  res.send({shadowsocks: {
    flow: shadowsocks.flow,
    time: shadowsocks.time,
  }, limit});
};

const setConfig = (req, res) => {
  const shadowsocks = req.body.shadowsocks;
  const limit = req.body.limit;
  config.plugins.freeAccount.shadowsocks.time = shadowsocks.time;
  config.plugins.freeAccount.shadowsocks.flow = shadowsocks.flow;
  config.plugins.freeAccount.limit = limit;
  res.send('success');
};

const user = (req, res) => {
  knex('freeAccount').select().where({
    isDisabled: false,
  }).orderBy('time', 'desc')
  .then(success => {
    res.send(success);
  }).catch(error => {
    res.status(403).end();
  });
};

const flow = (req, res) => {
  knex('freeAccount').sum('currentFlow as flow').then(success => {
    res.send(success[0]);
  }).catch(error => {
    res.status(403).end();
  });
};

exports.checkPassword = checkPassword;
exports.logout = logout;
exports.isManager = isManager;
exports.getConfig = getConfig;
exports.setConfig = setConfig;
exports.user = user;
exports.flow = flow;
