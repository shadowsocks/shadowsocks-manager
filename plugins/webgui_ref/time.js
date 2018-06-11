const knex = appRequire('init/knex').knex;
const account = appRequire('plugins/account/index');

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

};

const payWithRef = async (userId, orderType) => {
  const setting = await getRefSetting();
  if(!setting.useRef) { return; }
  const hasRef = await getRef(userId);
  if(!hasRef) { return; }
  console.log('hasRef: ' + hasRef + ' orderType: ' + orderType);
  const paymentType = {
    '2': 'week',
    '3': 'month',
    '4': 'day',
    '5': 'hour',
    '6': 'season',
    '7': 'year',
  };
  const paymentInfo = await getPaymentInfo(paymentType[orderType]);
  console.log(paymentInfo);
  const refTime = paymentInfo.refTime || '0h';
  let time = 0;
  if(refTime.match(/^(\d{1,})d(\d{1,})h$/)) {
    time = (+refTime.match(/^(\d{1,})d(\d{1,})h$/)[1]) * 86400 * 1000 + (+refTime.match(/^(\d{1,})d(\d{1,})h$/)[2]) * 3600 * 1000;
  } else if(refTime.match(/^(\d{1,})h$/)) {
    time =(+refTime.match(/^(\d{1,})h$/)[1]) * 3600 * 1000;
  }
  console.log(time);
  const accounts = await knex('account_plugin').where({ userId: hasRef });
  if(!accounts.length) { return; }
  console.log(accounts[0].id, time);
  account.editAccountTime(accounts[0].id, time, true);
};

exports.payWithRef = payWithRef;