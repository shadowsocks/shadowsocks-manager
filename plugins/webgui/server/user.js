'use strict';

const user = appRequire('plugins/user/index');

exports.signup = (req, res) => {
  user.addUser();
};
