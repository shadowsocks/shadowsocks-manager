'use strict';

appRequire('plugins/cli/menu/main');

const config = appRequire('services/config').all();
const addridx = config.manager.address.lastIndexOf(':');
const host = config.manager.address.substring(0,addridx);
const port = +config.manager.address.substr(addridx+1);
let managerAddress = {
  host: host,
  port: port,
  password: config.manager.password,
};

const setManagerAddress = (host, port, password) => {
  managerAddress.host = host;
  managerAddress.port = port;
  managerAddress.password = password;
};

const getManagerAddress = () => {
  return managerAddress;
};

exports.setManagerAddress = setManagerAddress;
exports.getManagerAddress = getManagerAddress;
