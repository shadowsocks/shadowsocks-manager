const knex = appRequire('init/knex').knex;
const config = appRequire('services/config').all();

const getOrders = async () => {
  return knex('webgui_order').where({});
};

const getOrdersAndAccountNumber = async () => {
  const orders = await knex('webgui_order').select([
    'webgui_order.id as id',
    'webgui_order.baseId as baseId',
    'webgui_order.name as name',
    'webgui_order.shortComment as shortComment',
    'webgui_order.comment as comment',
    'webgui_order.type as type',
    'webgui_order.cycle as cycle',
    'webgui_order.alipay as alipay',
    'webgui_order.paypal as paypal',
    'webgui_order.flow as flow',
    'webgui_order.refTime as refTime',
    'webgui_order.server as server',
    'webgui_order.autoRemove as autoRemove',
    'webgui_order.autoRemoveDelay as autoRemoveDelay',
    'webgui_order.portRange as portRange',
    'webgui_order.multiServerFlow as multiServerFlow',
    'webgui_order.changeOrderType as changeOrderType',
    'webgui_order.autoRemove as autoRemove',
    knex.raw('count(account_plugin.id) as accountNumber'),
  ])
  .leftJoin('account_plugin', 'account_plugin.orderId', 'webgui_order.id')
  .groupBy('webgui_order.id')
  .orderBy('webgui_order.name', 'ASC');
  return orders;
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
  const [ id ] = await knex('webgui_order').insert({
    baseId: data.baseId,
    name: data.name,
    shortComment: data.shortComment,
    comment: data.comment,
    type: data.type,
    cycle: data.cycle,
    alipay: data.alipay,
    paypal: data.paypal,
    flow: data.flow,
    refTime: data.refTime,
    server: data.server ? JSON.stringify(data.server) : null,
    autoRemove: data.autoRemove,
    autoRemoveDelay: data.autoRemoveDelay,
    portRange: data.portRange,
    multiServerFlow: data.multiServerFlow,
    changeOrderType: data.changeOrderType,
    active: data.active,
  });
  return id;
};

const editOrder = async data => {
  await knex('webgui_order').update({
    baseId: data.baseId,
    name: data.name,
    shortComment: data.shortComment,
    comment: data.comment,
    type: data.type,
    cycle: data.cycle,
    alipay: data.alipay,
    paypal: data.paypal,
    flow: data.flow,
    refTime: data.refTime,
    server: data.server ? JSON.stringify(data.server) : null,
    autoRemove: data.autoRemove,
    autoRemoveDelay: data.autoRemoveDelay,
    portRange: data.portRange,
    multiServerFlow: data.multiServerFlow,
    changeOrderType: data.changeOrderType,
    active: data.active,
  }).where({
    id: data.id,
  });
  return;
};

const deleteOrder = async orderId => {
  const orderInfo = await knex('webgui_order').where({ id: orderId }).then(s => s[0]);
  if(orderInfo.baseId) {
    await knex('webgui_order').delete().where({ id: orderId });
  } else {
    const hasAccount = await knex('account_plugin').where({ orderId });
    if(hasAccount.length) { return Promise.reject('account with this order exists'); }
    const isGiftCardOn = config.plugins.giftcard && config.plugins.giftcard.use;
    const hasGiftcard = isGiftCardOn ? await knex('giftcard').where({ orderType: orderId, status: 'AVAILABLE' }) : [];
    if(hasGiftcard.length) { return Promise.reject('giftcard with this order exists'); }
    const hasFlowPackOrder = await knex('webgui_order').where({ baseId: orderId });
    if(hasFlowPackOrder.length) { return Promise.reject('flowpack order exists'); }
    await knex('webgui_order').delete().where({ id: orderId });
  }
  return;
};

exports.getOrders = getOrders;
exports.getOrdersAndAccountNumber = getOrdersAndAccountNumber;
exports.getOneOrder = getOneOrder;
exports.newOrder = newOrder;
exports.editOrder = editOrder;
exports.deleteOrder = deleteOrder;
exports.getOneOrderByAccountId = getOneOrderByAccountId;
