const knex = appRequire('init/knex').knex;

const getGroups = () => {
  return knex('group').where({}).orderBy('id').then(s => s);
};

const getOneGroup = id => {
  return knex('group').select().where({ id }).then(success => {
    if(!success.length) { return Promise.reject('group not found'); }
    return success[0];
  });
};

const addGroup = (name, comment, showNotice) => {
  return knex('group').insert({
    name, comment, showNotice,
  });
};

const editGroup = (id, name, comment, showNotice) => {
  return knex('group').update({
    name, comment, showNotice,
  }).where({ id });
};

const deleteGroup = async id => {
  if(id === 0) { return; }
  const users = await knex('user').where({ group: id });
  if(users.length > 0) { return Promise.reject('Can not delete group'); }
  await knex('group').delete().where({ id });
  return;
};

const setUserGroup = (groupId, userId) => {
  return knex('user').update({ group: groupId }).where({ id: userId });
};

exports.getGroups = getGroups;
exports.getOneGroup = getOneGroup;
exports.addGroup = addGroup;
exports.editGroup = editGroup;
exports.deleteGroup = deleteGroup;
exports.setUserGroup = setUserGroup;