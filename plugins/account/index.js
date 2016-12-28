'use strict';

const knex = appRequire('init/knex').knex;
const serverManager = appRequire('plugins/flowSaver/server');
const manager = appRequire('services/manager');
const checkAccount = appRequire('plugins/account/checkAccount');

const addAccount = async (type, options) => {
  if(type === 1) {
    await knex('account_plugin').insert({
      type,
      userId: options.user,
      port: options.port,
      password: options.password,
      status: 0,
    });
    await checkAccount.checkServer();
    return;
  } else if (type >= 2 && type <= 5) {
    await knex('account_plugin').insert({
      type,
      userId: options.user,
      port: options.port,
      password: options.password,
      data: JSON.stringify({
        create: Date.now(),
        flow: options.flow || 1 * 1000 * 1000 * 1000,
        limit: options.limit || 1,
      }),
      status: 0,
    });
    await checkAccount.checkServer();
    return;
  }
};

const changePort = async (id, port) => {
  const result = await knex('account_plugin').update({ port }).where({ id });
  // console.log(result);
  await checkAccount.checkServer();
};

const getAccount = async () => {
  const account = await knex('account_plugin').select();
  return account;
};

const delAccount = async (id) => {
  const result = await knex('account_plugin').delete().where({ id });
  if(!result) {
    return Promise.reject('Account id[' + id + '] not found');
  }
  await checkAccount.checkServer();
  return result;
};

exports.addAccount = addAccount;
exports.getAccount = getAccount;
exports.delAccount = delAccount;
exports.changePort = changePort;
