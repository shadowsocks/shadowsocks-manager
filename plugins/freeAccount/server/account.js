'use strict';

const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const flow = appRequire('plugins/flowSaver/flow');
const crypto = require('crypto');
const config = appRequire('services/config').all();

const getRandomPort = async (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  let port;
  let isPortExist = true;
  let number = 0;
  while(isPortExist && number < 20) {
    port = Math.floor(Math.random() * (max - min + 1)) + min;
    isPortExist = (await knex('freeAccount').select().where({port}))[0];
    number++;
  }
  return isPortExist ? Promise.reject('Get Random Port Fail') : port;
};

const createAccount = async (email) => {
  // check if this email has an account,
  // if true, return old account instead of create one.
  const oldAccount = await knex('freeAccount').select().where({email, isDisabled: false});
  if(oldAccount.length > 0) {
    return oldAccount[0].address;
  }
  // TODO: check if free account out of limit


  // create account
  const min = config.plugins.freeAccount.shadowsocks.startPort;
  const max = config.plugins.freeAccount.shadowsocks.endPort;
  const port = await getRandomPort(min, max);
  const password = crypto.randomBytes(4).toString('hex');
  try {
    await manager.send({
      command: 'add',
      port,
      password,
    });
    const address = crypto.randomBytes(16).toString('hex');
    await knex('freeAccount').insert({
      address,
      email,
      port,
      flow: config.plugins.freeAccount.shadowsocks.flow * 1000 * 1000,
      currentFlow: 0,
      time: Date.now(),
      expired: Date.now() + config.plugins.freeAccount.shadowsocks.time * 60 * 1000,
      isDisabled: false,
    });
    return address;
  } catch(err) {
    console.log(err);
    return Promise.reject(err);
  }
};

const checkAccount = async () => {
  try {
    const list = await manager.send({
      command: 'list',
    });
    const account = await knex('freeAccount').select().where({
      isDisabled: false
    });
    account.forEach(async f => {
      const myFlow = (await flow.getFlow(f.time, f.expired)).filter(fil => {
        return fil.port === f.port;
      })[0];
      if(myFlow) {
        await knex('freeAccount').where({
          address: f.address,
        }).update({
          currentFlow: myFlow.sumFlow,
        });
      }
      if(Date.now() >= f.expired || f.currentFlow >= f.flow) {
        await knex('freeAccount').where({
          address: f.address,
        }).update({
          isDisabled: true,
        });
        await manager.send({
          command: 'del',
          port: f.port,
        });
      }
    });
  } catch(err) {
    console.log(err);
  }
};

checkAccount();
setInterval(() => {
  checkAccount();
}, 60 * 1000);

exports.createAccount = createAccount;
