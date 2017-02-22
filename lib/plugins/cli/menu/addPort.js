'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const manager = appRequire('services/manager');
const index = appRequire('plugins/cli/index');

const inquirer = require('inquirer');

const menu = [{
  type: 'input',
  name: 'port',
  message: 'Enter port:',
  validate: function (value) {
    if (Number.isNaN(+value)) {
      return 'Please enter a valid port number.';
    } else if (+value <= 0 || +value >= 65536) {
      return 'Port number must between 1 to 65535.';
    } else {
      return true;
    }
  }
}, {
  type: 'input',
  name: 'password',
  message: 'Enter password:',
  validate: function (value) {
    if (value === '') {
      return 'You can not set an empty password.';
    } else {
      return true;
    }
  }
}];

const add = (() => {
  var _ref = _asyncToGenerator(function* () {
    try {
      const addPort = yield inquirer.prompt(menu);
      yield manager.send({
        command: 'add',
        port: +addPort.port,
        password: addPort.password
      }, index.getManagerAddress());
      return;
    } catch (err) {
      return Promise.reject(err);
    }
  });

  return function add() {
    return _ref.apply(this, arguments);
  };
})();

exports.add = add;