'use strict';

const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const flow = appRequire('plugins/flowSaver/flow');
const crypto = require('crypto');
const config = appRequire('services/config').all();

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const createAccount = async (email, flow) => {
  const min = config.plugins.freeAccount.startPort;
  const max = config.plugins.freeAccount.endPort;
  const port = getRandomInt(min, max);
  const password = crypto.randomBytes(6).toString('hex');
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
      flow: config.plugins.freeAccount.flow * 1000 * 1000,
      currentFlow: 0,
      time: Date.now(),
      expired: Date.now() + config.plugins.freeAccount.time * 60 * 1000,
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
