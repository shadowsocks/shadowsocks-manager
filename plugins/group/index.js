const knex = appRequire('init/knex').knex;

const getGroups = () => {
  return knex('group').where({}).orderBy('id').then(s => s);
};

const getGroupsAndUserNumber = async () => {
  const groups = await knex('group').select([
    'group.id as id',
    'group.name as name',
    'group.comment as comment',
    knex.raw('count(user.id) as userNumber'),
  ])
  .leftJoin('user', 'user.group', 'group.id')
  .where('user.id', '>', 1)
  .orWhereNull('user.id')
  .groupBy('group.id');
  return groups;
};

const getOneGroup = id => {
  return knex('group').select().where({ id }).then(success => {
    if(!success.length) { return Promise.reject('group not found'); }
    return success[0];
  });
};

const addGroup = (name, comment, showNotice, order, multiAccount) => {
  return knex('group').insert({
    name, comment, showNotice, order, multiAccount
  });
};

const editGroup = (id, name, comment, showNotice, order, multiAccount) => {
  return knex('group').update({
    name,
    comment,
    showNotice,
    order,
    multiAccount,
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
exports.getGroupsAndUserNumber = getGroupsAndUserNumber;
exports.getOneGroup = getOneGroup;
exports.addGroup = addGroup;
exports.editGroup = editGroup;
exports.deleteGroup = deleteGroup;
exports.setUserGroup = setUserGroup;
