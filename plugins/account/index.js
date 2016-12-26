'use strict';

const knex = appRequire('init/knex').knex;

const addAccount = async (type, options) => {
  if(type === 1) {
    await knex('account_plugin').insert({
      type: 1,
      userId: options.user,
      port: options.port,
      password: options.password,
    });
    return;
  }
};

const getAccount = async () => {
  const account = await knex('account_plugin').select();
  return account;
};

exports.addAccount = addAccount;
exports.getAccount = getAccount;

// const checkServer = async () => {
//   const account = await knex('account_plugin').select();
//   account.forEach(f => {
//
//   });
// };
