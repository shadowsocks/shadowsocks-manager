'use strict';

const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const flow = appRequire('plugins/flowSaver/flow');

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
