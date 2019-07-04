const knex = appRequire('init/knex').knex;
const redis = appRequire('init/redis').redis;
const crypto = require('crypto');
// const macAccount = appRequire('plugins/macAccount/index');

const checkPasswordLimit = {
  number: 5,
  time: 60,
};
// const checkPasswordFail = {};

const checkExist = async (obj) => {
  const user = await knex('user').select().where(obj);
  if(user.length === 0) {
    return;
  } else {
    return Promise.reject('user exists');
  }
};

const md5 = function(text) {
  return crypto.createHash('md5').update(text).digest('hex');
};

const createPassword = function(password, username) {
  return md5(password + username);
};

const addUser = async (options) => {
  try {
    const insert = {};
    if(options.username) {
      await checkExist({username: options.username});
      Object.assign(insert, {username: options.username});
    }
    if(options.email) {
      await checkExist({email: options.email});
      Object.assign(insert, {email: options.email});
    }
    if(options.telegram) {
      await checkExist({telegram: options.telegram});
      Object.assign(insert, {telegram: options.telegram});
    }
    Object.assign(insert, {
      type: options.type,
      createTime: Date.now()
    });
    if(options.username && options.password) {
      Object.assign(insert, {
        password: createPassword(options.password, options.username)
      });
    }
    if(options.group) {
      Object.assign(insert, { group: options.group });
    }
    if(options.telegramId) {
      Object.assign(insert, { telegram: options.telegramId });
    }
    const user = await knex('user').insert(insert);
    return user;
  } catch(err) {
    console.log(err);
    return Promise.reject(err);
  }
};

const checkPassword = async (username, password) => {
  try {
    const user = await knex('user').select(['id', 'type', 'username', 'password']).where({
      username,
    }).then(s => s[0]);
    if(!user) {
      return Promise.reject('user not exists');
    }
    // for(const cpf in checkPasswordFail) {
    //   if(Date.now() - checkPasswordFail[cpf].time >= checkPasswordLimit.time) {
    //     delete checkPasswordFail[cpf];
    //   }
    // };
    // if(checkPasswordFail[username] &&
    //   checkPasswordFail[username].number > checkPasswordLimit.number &&
    //   Date.now() - checkPasswordFail[username].time < checkPasswordLimit.time
    // ) {
    //   return Promise.reject('password retry out of limit');
    // }
    const failNumber = await redis.get(`Temp:CheckPasswordFail:${ user.id }`);
    if(+failNumber >= checkPasswordLimit.number) {
      return Promise.reject('password retry out of limit');
    }
    if(createPassword(password, username) === user.password) {
      await knex('user').update({
        lastLogin: Date.now(),
      }).where({
        username,
      });
      return user;
    } else {
      // if(!checkPasswordFail[username] || Date.now() - checkPasswordFail[username].time >= checkPasswordLimit.time) {
      //   checkPasswordFail[username] = { number: 1, time: Date.now() };
      // } else if(checkPasswordFail[username].number <= checkPasswordLimit.number) {
      //   checkPasswordFail[username].number += 1;
      //   checkPasswordFail[username].time = Date.now();
      // }
      const failNumber = await redis.incr(`Temp:CheckPasswordFail:${ user.id }`);
      if(+failNumber === 1) {
        await redis.expire(`Temp:CheckPasswordFail:${ user.id }`, checkPasswordLimit.time);
      }
      return Promise.reject('invalid password');
    }
  } catch(err) {
    return Promise.reject(err);
  }
};

const editUser = async (userInfo, edit) => {
  try {
    const username = (await knex('user').select().where(userInfo))[0].username;
    if(!username) {
      throw new Error('user not found');
    }
    if(edit.password) {
      edit.password = createPassword(edit.password, username);
    }
    const user = await knex('user').update(edit).where(userInfo);
    return;
  } catch(err) {
    return Promise.reject(err);
  }
};

const getUsers = async () => {
  const users = await knex('user').select().where({
    type: 'normal',
  });
  return users;
};

const getRecentSignUpUsers = async (number, group) => {
  const where = { type: 'normal' };
  if(group >= 0) { where.group = group; }
  const users = await knex('user').select().where(where).orderBy('createTime', 'desc').limit(number);
  return users;
};

const getRecentLoginUsers = async (number, group) => {
  const where = { type: 'normal' };
  if(group >= 0) { where.group = group; }
  const users = await knex('user').select().where(where).orderBy('lastLogin', 'desc').limit(number);
  return users;
};

const getOneUser = async (id) => {
  const user = await knex('user').select().where({
    type: 'normal',
    id,
  });
  if(!user.length) {
    return Promise.reject('User not found');
  }
  return user[0];
};

const getOneAdmin = async (id) => {
  const user = await knex('user').select().where({
    type: 'admin',
    id,
  }).where('id', '>', 1);
  if(!user.length) {
    return Promise.reject('User not found');
  }
  return user[0];
};

const getUserAndPaging = async (opt = {}) => {

  const search = opt.search || '';
  const filter = opt.filter || 'all';
  const sort = opt.sort || 'id_asc';
  const page = opt.page || 1;
  const pageSize = opt.pageSize || 20;
  const type = opt.type || ['normal'];
  const group = opt.hasOwnProperty('group') ? opt.group : -1;

  let count = knex('user').select()
  .where('id', '>', 1)
  .whereIn('type', type);

  let users = knex('user').select([
    'user.id as id',
    'user.username as username',
    'user.email as email',
    'user.telegram as telegram',
    'user.password as password',
    'user.type as type',
    'user.createTime as createTime',
    'user.lastLogin as lastLogin',
    'user.resetPasswordId as resetPasswordId',
    'user.resetPasswordTime as resetPasswordTime',
    'account_plugin.port as port',
  ]).leftJoin('account_plugin', 'user.id', 'account_plugin.userId')
  .where('user.id', '>', 1)
  .whereIn('user.type', type).groupBy('user.id');

  if(group >= 0) {
    count = count.where({ 'user.group': group });
    users = users.where({ 'user.group': group });
  }
  if(search) {
    count = count.where('username', 'like', `%${ search }%`);
    users = users.where('username', 'like', `%${ search }%`);
  }

  count = await count.count('id as count').then(success => success[0].count);
  users = await users.orderBy(sort.split('_')[0], sort.split('_')[1]).limit(pageSize).offset((page - 1) * pageSize);
  const maxPage = Math.ceil(count / pageSize);
  return {
    total: count,
    page,
    maxPage,
    pageSize,
    users,
  };
};

const deleteUser = async userId => {
  if(!userId) {
    return Promise.reject('invalid userId');
  }
  const existAccount = await knex('account_plugin').select().where({
    userId,
  });
  if(existAccount.length) {
    return Promise.reject('delete user fail');
  }
  const macAccount = appRequire('plugins/macAccount/index');
  const macAccounts = await macAccount.getAccountByUserId(userId);
  if(macAccounts.length) {
    macAccounts.forEach(f => {
      macAccount.deleteAccount(f.id);
    });
  }
  const deleteCount = await knex('user').delete().where({
    id: userId,
  }).where('id', '>', 1);
  if(deleteCount >= 1) {
    return;
  } else {
    return Promise.reject('delete user fail');
  }
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const userInfo = await knex('user').where({
    id: userId,
  }).then(user => {
    if(!user.length) { return Promise.reject('user not found'); }
    return user[0];
  });
  await checkPassword(userInfo.username, oldPassword);
  await editUser({
    id: userId, 
  }, {
    password: newPassword,
  });
};

exports.add = addUser;
exports.edit = editUser;
exports.checkPassword = checkPassword;
exports.get = getUsers;
exports.getRecentSignUp = getRecentSignUpUsers;
exports.getRecentLogin = getRecentLoginUsers;
exports.getOne = getOneUser;
exports.getOneAdmin = getOneAdmin;
exports.getUserAndPaging = getUserAndPaging;
exports.delete = deleteUser;
exports.changePassword = changePassword;
