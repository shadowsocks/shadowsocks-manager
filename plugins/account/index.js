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
  }
};

const getAccount = async () => {
  const account = await knex('account_plugin').select();
  return account;
};

exports.addAccount = addAccount;
exports.getAccount = getAccount;
