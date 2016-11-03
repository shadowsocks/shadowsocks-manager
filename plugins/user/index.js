'use strict';

const knex = appRequire('init/knex').knex;

const checkExist = async (obj) => {
  const user = await knex('user').select().where(obj);
  if(user.length === 0) {
    return;
  } else {
    return Promise.reject();
  }
};

const addUser = async (options) => {
  try {
    if(options.username) { await checkExist({username: options.username}); }
    if(options.email) { await checkExist({email: options.email}); }
    if(options.telegram) { await checkExist({telegram: options.telegram}); }
    return knex('user').insert({
      username: options.username,
      email: options.email,
      telegram: options.telegram,
      password: options.password,
      type: options.type,
      createTime: Date.now(),
    });
  } catch(err) {
    return Promise.reject(err);
  }
};

const checkPassword = () => {};
