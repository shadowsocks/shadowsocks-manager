const knex = appRequire('init/knex').knex;

const getGroups = () => {
  return knex('group').where({}).then(s => s);
};

const getOneGroup = id => {
  return knex('group').select().where({ id }).then(success => {
    if(!success.length) { return Promise.reject('group not found'); }
    return success[0];
  });
};

const addGroup = (name, comment) => {
  return knex('group').insert({
    name, comment,
  });
};

const editGroup = (id, name, comment) => {
  return knex('group').update({
    name, comment,
  }).where({ id });
};

const deleteGroup = id => {};

const setUserGroup = (groupId, userId) => {
  return knex('user').update({ group: groupId }).where({ id: userId });
};

exports.getGroups = getGroups;
exports.getOneGroup = getOneGroup;
exports.addGroup = addGroup;
exports.editGroup = editGroup;
exports.deleteGroup = deleteGroup;
exports.setUserGroup = setUserGroup;