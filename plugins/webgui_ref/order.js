const knex = appRequire('init/knex').knex;
const moment = require('moment');

const newOrderId = () => {
  return moment().format('YYYYMMDDHHmmss') + Math.random().toString().substr(2, 6);
};

const newOrder = async data => {
  await knex('webgui_ref_time').insert({
    orderId: newOrderId(),
    user: data.user,
    refUser: data.refUser,
    account: data.account,
    refTime: data.refTime,
    status: 'FINISH',
    createTime: Date.now(),
  });
  return;
};

const getUserOrders = async userId => {
  const orders = await knex('webgui_ref_time').select([
    'webgui_ref_time.orderId',
    'user.id as userId',
    'user.group as group',
    'user.username',
    'account_plugin.port',
    'webgui_ref_time.refTime',
    'webgui_ref_time.status',
    'webgui_ref_time.createTime',
  ])
  .leftJoin('user', 'user.id', 'webgui_ref_time.user')
  .leftJoin('account_plugin', 'account_plugin.id', 'webgui_ref_time.account')
  .where({ 'user.id': userId });
  return orders;
};

const orderListAndPaging = async (options = {}) => {
  const search = options.search || '';
  const group = options.group;
  const filter = options.filter || [];
  const sort = options.sort || 'webgui_ref_time.createTime_desc';
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const start = options.start ? moment(options.start).hour(0).minute(0).second(0).millisecond(0).toDate().getTime() : moment(0).toDate().getTime();
  const end = options.end ? moment(options.end).hour(23).minute(59).second(59).millisecond(999).toDate().getTime() : moment().toDate().getTime();

  let count = knex('webgui_ref_time').select().whereBetween('webgui_ref_time.createTime', [start, end]);
  let orders = knex('webgui_ref_time').select([
    'webgui_ref_time.orderId',
    'user.id as userId',
    'user.group as group',
    'user.username',
    'account_plugin.port',
    'webgui_ref_time.refTime',
    'webgui_ref_time.status',
    'webgui_ref_time.createTime',
  ])
  .leftJoin('user', 'user.id', 'webgui_ref_time.user')
  .leftJoin('account_plugin', 'account_plugin.id', 'webgui_ref_time.account')
  .whereBetween('webgui_ref_time.createTime', [start, end]);

  if(filter.length) {
    count = count.whereIn('webgui_ref_time.status', filter);
    orders = orders.whereIn('webgui_ref_time.status', filter);
  }
  if(group >= 0) {
    count = count.leftJoin('user', 'user.id', 'webgui_ref_time.user').where({ 'user.group': group });
    orders = orders.where({ 'user.group': group });
  }
  if(search) {
    count = count.where('webgui_ref_time.orderId', 'like', `%${ search }%`);
    orders = orders.where('webgui_ref_time.orderId', 'like', `%${ search }%`);
  }

  count = await count.count('orderId as count').then(success => success[0].count);
  orders = await orders.orderBy(
    sort.split('_').slice(0, sort.split('_').length - 1).join('_'),
    sort.split('_')[sort.split('_').length - 1]
  ).limit(pageSize).offset((page - 1) * pageSize);
  const maxPage = Math.ceil(count / pageSize);
  return {
    total: count,
    page,
    maxPage,
    pageSize,
    orders,
  };
};

const getUserFinishOrder = async userId => {
  let orders = await knex('webgui_ref_time').select([
    'orderId',
    'refTime',
    'createTime',
  ]).where({
    user: userId
  }).orderBy('createTime', 'DESC');
  orders = orders.map(order => {
    return {
      orderId: order.orderId,
      type: '邀请奖励',
      refTime: order.refTime,
      createTime: order.createTime,
    };
  });
  return orders;
};

exports.newOrder = newOrder;
exports.getUserOrders = getUserOrders;
exports.orderListAndPaging = orderListAndPaging;
exports.getUserFinishOrder = getUserFinishOrder;
