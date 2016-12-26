function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const knex = appRequire('init/knex').knex;
const serverManager = appRequire('plugins/flowSaver/server');
const manager = appRequire('services/manager');

let messages = [];

setInterval(() => {
  if (!messages.length) {
    return;
  }
  messages.forEach(message => {
    // console.log(message);
    manager.send(message[0], message[1]).then().catch();
  });
  messages = [];
}, 10 * 1000);

const checkServer = (() => {
  var _ref = _asyncToGenerator(function* () {
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
      var _ref2 = _asyncToGenerator(function* (s) {
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
          var _ref3 = _asyncToGenerator(function* (a) {
            if (!port.exist(a.port)) {
              messages.push([{
                command: 'add',
                port: a.port,
                password: a.password
              }, {
                host: s.host,
                port: s.port,
                password: s.password
              }]);
            }
          });

          return function (_x2) {
            return _ref3.apply(this, arguments);
          };
        })());
        port.forEach((() => {
          var _ref4 = _asyncToGenerator(function* (p) {
            if (!account.exist(p.port)) {
              messages.push([{
                command: 'del',
                port: p.port,
                password: p.password
              }, {
                host: s.host,
                port: s.port,
                password: s.password
              }]);
            }
          });

          return function (_x3) {
            return _ref4.apply(this, arguments);
          };
        })());
      });

      return function (_x) {
        return _ref2.apply(this, arguments);
      };
    })());
  });

  return function checkServer() {
    return _ref.apply(this, arguments);
  };
})();

exports.checkServer = checkServer;

checkServer();
setInterval(() => {
  checkServer();
}, 120 * 1000);