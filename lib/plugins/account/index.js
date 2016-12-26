'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const knex = appRequire('init/knex').knex;
const serverManager = appRequire('plugins/flowSaver/server');
const manager = appRequire('services/manager');

const addAccount = (() => {
  var _ref = _asyncToGenerator(function* (type, options) {
    if (type === 1) {
      yield knex('account_plugin').insert({
        type: 1,
        userId: options.user,
        port: options.port,
        password: options.password
      });
      return;
    }
  });

  return function addAccount(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

const getAccount = (() => {
  var _ref2 = _asyncToGenerator(function* () {
    const account = yield knex('account_plugin').select();
    return account;
  });

  return function getAccount() {
    return _ref2.apply(this, arguments);
  };
})();

exports.addAccount = addAccount;
exports.getAccount = getAccount;

const checkServer = (() => {
  var _ref3 = _asyncToGenerator(function* () {
    const account = yield knex('account_plugin').select();
    const server = yield serverManager.list();
    // console.log(server);
    // console.log(account);
    account.exist = function (number) {
      return !!account.filter(function (f) {
        return f.port === number;
      })[0];
    };
    server.forEach((() => {
      var _ref4 = _asyncToGenerator(function* (s) {
        const port = yield manager.send({
          command: 'list'
        }, {
          host: s.host,
          port: s.port,
          password: s.password
        });
        port.exist = function (number) {
          return !!port.filter(function (f) {
            return f.port === number;
          })[0];
        };
        account.forEach((() => {
          var _ref5 = _asyncToGenerator(function* (a) {
            if (!port.exist(a.port)) {
              manager.send({
                command: 'add',
                port: a.port,
                password: a.password
              }, {
                host: s.host,
                port: s.port,
                password: s.password
              }).then(console.log).catch(console.log);
            }
          });

          return function (_x4) {
            return _ref5.apply(this, arguments);
          };
        })());
        port.forEach((() => {
          var _ref6 = _asyncToGenerator(function* (p) {
            if (!account.exist(p.port)) {
              manager.send({
                command: 'del',
                port: p.port,
                password: p.password
              }, {
                host: s.host,
                port: s.port,
                password: s.password
              }).then(console.log).catch(console.log);
            }
          });

          return function (_x5) {
            return _ref6.apply(this, arguments);
          };
        })());
      });

      return function (_x3) {
        return _ref4.apply(this, arguments);
      };
    })());
  });

  return function checkServer() {
    return _ref3.apply(this, arguments);
  };
})();

checkServer();
setInterval(() => {
  checkServer();
}, 120 * 1000);