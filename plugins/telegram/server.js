'use strict';

const _ = require('lodash');
const config = appRequire('services/config').all();
const isFlowSaverUse = _.get(config, 'plugins.flowSaver.use');

const init = async () => {
  if(!isFlowSaverUse) {
    return;
  }
  const server = appRequire('plugins/flowSaver/server');
  const list = await server.list();
  if(list.length === 0) {
    const host = config.manager.address.split(':')[0];
    const port = +config.manager.address.split(':')[1];
    const password = config.manager.password;
    await server.add('default', host, port, password);
  }
};

init();
