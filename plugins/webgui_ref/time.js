const knex = appRequire('init/knex').knex;
const account = appRequire('plugins/account/index');
const order = appRequire('plugins/webgui_ref/order');
const orderPlugin = appRequire('plugins/webgui_order');

const getRefSetting = async () => {
  const setting = await knex('webguiSetting').select().where({
    key: 'webgui_ref',
  }).then(success => {
    if(!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value;
  });
  return setting;
};

const getRef = async userId => {
  const ref = await knex('webgui_ref').select([
    'webgui_ref_code.sourceUserId as sourceUserId',
  ])
  .leftJoin('webgui_ref_code', 'webgui_ref.codeId', 'webgui_ref_code.id')
  .where({
    'webgui_ref.userId': userId
  });
  if(!ref.length) { return false; }
  if(!ref[0].sourceUserId) { return false; }
  return ref[0].sourceUserId;
};

const getPaymentInfo = async type => {
  const payment = await knex('webguiSetting').where({
    key: 'payment'
  }).then(s => s[0]);
  const paymentInfo = JSON.parse(payment.value);
  return paymentInfo[type];
};

const convertRefTime = timeString => {
  let time = 0;
  const timeArray = timeString.split(/(\d{1,}d)|(\d{1,}h)|(\d{1,}m)/).filter(f => f);
  timeArray.forEach(f => {
    if(f[f.length - 1] === 'd') { time += (+f.substr(0, f.length - 1)) * 24 * 60 * 60 * 1000; }
    if(f[f.length - 1] === 'h') { time += (+f.substr(0, f.length - 1)) * 60 * 60 * 1000; }
    if(f[f.length - 1] === 'm') { time += (+f.substr(0, f.length - 1)) * 60 * 1000; }
  });
  return time;
};

const payWithRef = async (userId, orderType) => {
  const setting = await getRefSetting();
  if(!setting.useRef) { return; }
  const hasRef = await getRef(userId);
  if(!hasRef) { return; }
  const orderInfo = await orderPlugin.getOneOrder(orderType);
  const accounts = await knex('account_plugin').where({ userId: hasRef });
  if(!accounts.length) { return; }
  for(let a of accounts) {
    account.editAccountTimeForRef(a.id, Math.ceil(orderInfo.refTime / accounts.length), true);
    await order.newOrder({
      user: hasRef,
      refUser: userId,
      account: a.id,
      refTime: Math.ceil(orderInfo.refTime / accounts.length),
    });
  }
};

exports.payWithRef = payWithRef;
