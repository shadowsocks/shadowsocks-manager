const knex = appRequire('init/knex').knex;

const getGroups = () => {
  return knex('group').where({}).orderBy('id').then(s => s);
};

const getGroupsAndUserNumber = async () => {
  const groups = await knex('group').select([
    'group.id as id',
    'group.name as name',
    'group.comment as comment',
    'group.order as order',
  ])
  .count('user.id as userNumber')
  .leftJoin('user', 'user.group', 'group.id')
  .groupBy('group.id');
  groups.forEach(group => {
    if(group.order) {
      group.order = JSON.parse(group.order);
    }
  });
  return groups;
};

const getOneGroup = id => {
  return knex('group').select().where({ id }).then(success => {
    if(!success.length) { return Promise.reject('group not found'); }
    return success[0];
  });
};

const addGroup = (name, comment, order, multiAccount) => {
  return knex('group').insert({
    name, comment, order, multiAccount
  });
};

const editGroup = (id, name, comment, order, multiAccount) => {
  return knex('group').update({
    name,
    comment,
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

const editMultiGroupForOrder = async (orderId, ids) => {
  const groups = await knex('group')
  .whereNotNull('order')
  .then(success => success.map(group => {
    group.order = JSON.parse(group.order);
    return group;
  }));
  for(const group of groups) {
    if(ids.map(m => +m).includes(group.id)) {
      if(!group.order.includes(orderId)) {
        group.order.push(orderId);
      }
    } else {
      const index = group.order.indexOf(orderId);
      if(index >= 0) {
        group.order.splice(index, 1);
      }
    }
    await knex('group').update({
      order: JSON.stringify(group.order)
    }).where({ id: group.id });
  };
};

exports.getGroups = getGroups;
exports.getGroupsAndUserNumber = getGroupsAndUserNumber;
exports.getOneGroup = getOneGroup;
exports.addGroup = addGroup;
exports.editGroup = editGroup;
exports.deleteGroup = deleteGroup;
exports.setUserGroup = setUserGroup;
exports.editMultiGroupForOrder = editMultiGroupForOrder;
