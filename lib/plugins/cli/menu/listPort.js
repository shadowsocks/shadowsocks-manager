'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const manager = appRequire('services/manager');
const index = appRequire('plugins/cli/index');

const inquirer = require('inquirer');

const menu = [{
  type: 'list',
  name: 'port',
  message: 'Select port:',
  choices: []
}, {
  type: 'list',
  name: 'act',
  message: 'What do you want?',
  choices: ['Delete port', 'Change password', 'Exit'],
  when: function (answers) {
    if (answers.port === 'Exit') {
      return Promise.resolve();
    } else {
      return answers;
    }
  }
}];

const password = {
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
};

const listPort = (() => {
  var _ref = _asyncToGenerator(function* () {
    try {
      const result = yield manager.send({
        command: 'list'
      }, index.getManagerAddress());
      menu[0].choices = [];
      result.forEach(function (f) {
        const name = (f.port + '     ').substr(0, 5) + ', ' + f.password;
        const value = f.port;
        menu[0].choices.push({
          name,
          value
        });
      });
      menu[0].choices.push({
        name: 'Exit', value: 'Exit'
      });
      return;
    } catch (err) {
      console.log(err);
      return Promise.reject(err);
    }
  });

  return function listPort() {
    return _ref.apply(this, arguments);
  };
})();

const list = (() => {
  var _ref2 = _asyncToGenerator(function* () {
    try {
      yield listPort();
      const selectPort = yield inquirer.prompt(menu);
      if (selectPort.act === 'Delete port') {
        yield manager.send({
          command: 'del',
          port: selectPort.port
        }, index.getManagerAddress());
        return;
      } else if (selectPort.act === 'Change password') {
        const newPassword = yield inquirer.prompt(password);
        yield manager.send({
          command: 'pwd',
          port: selectPort.port,
          password: newPassword.password
        }, index.getManagerAddress());
        return;
      } else if (selectPort.act === 'Exit') {
        return;
      }
    } catch (err) {
      console.log(err);
      return Promise.reject(err);
    }
  });

  return function list() {
    return _ref2.apply(this, arguments);
  };
})();

exports.list = list;