const knex = appRequire('init/knex').knex;

const getOrders = async () => {
  return knex('webgui_order').where({});
};

const getOneOrder = async orderId => {
  const order = await knex('webgui_order').where({ id: orderId }).then(s => s[0]);
  if(!order) { return Promise.reject('order not found'); }
  return order;
};

const getOneOrderByAccountId = async accountId => {
  const order = await knex('webgui_order').select([
    'webgui_order.id as id',
    'webgui_order.changeOrderType as changeOrderType',
  ]).leftJoin('account_plugin', 'account_plugin.orderId', 'webgui_order.id')
  .where({ 'account_plugin.id': accountId }).then(s => s[0]);
  return order;
};

const newOrder = async data => {
  await knex('webgui_order').insert({
    name: data.name,
    comment: data.comment,
    type: data.type,
    cycle: data.cycle,
    alipay: data.alipay,
    paypal: data.paypal,
    flow: data.flow,
    refTime: data.refTime,
    server: data.server ? JSON.stringify(data.server) : null,
    autoRemove: data.autoRemove,
    multiServerFlow: data.multiServerFlow,
    changeOrderType: data.changeOrderType,
  });
  return;
};

const editOrder = async data => {
  await knex('webgui_order').update({
    name: data.name,
    comment: data.comment,
    type: data.type,
    cycle: data.cycle,
    alipay: data.alipay,
    paypal: data.paypal,
    flow: data.flow,
    refTime: data.refTime,
    server: data.server ? JSON.stringify(data.server) : null,
    autoRemove: data.autoRemove,
    multiServerFlow: data.multiServerFlow,
    changeOrderType: data.changeOrderType,
  }).where({
    id: data.id,
  });
  return;
};

const deleteOrder = async orderId => {
  await knex('webgui_order').delete().where({ id: orderId });
  return;
};

exports.getOrders = getOrders;
exports.getOneOrder = getOneOrder;
exports.newOrder = newOrder;
exports.editOrder = editOrder;
exports.deleteOrder = deleteOrder;
exports.getOneOrderByAccountId = getOneOrderByAccountId;