const knex = appRequire('init/knex').knex;

knex('webguiSetting').select().where({
  key: 'system',
}).then(success => {
  if(success.length) {
    return;
  }
  const value = {
    accountForNewUser: {
      isEnable: true,
      flow: 350,
      type: 5,
      limit: 8,
    },
    signUp: {
      isEnable: true,
    },
    multiServerFlow: false,
    port: {
      start: 50000,
      end: 60000,
      random: false,
    }
  };
  return knex('webguiSetting').insert({
    key: 'system',
    value: JSON.stringify(value),
  });
}).then();
knex('webguiSetting').select().where({
  key: 'payment',
}).then(success => {
  if(success.length) {
    return;
  }
  const value = {
    hour: {
      alipay: 0.15,
      paypal: 0,
      flow: 500,
    },
    day: {
      alipay: 0.66,
      paypal: 0,
      flow: 5000,
    },
    week: {
      alipay: 2.99,
      paypal: 0,
      flow: 30000,
    },
    month: {
      alipay: 9.99,
      paypal: 0,
      flow: 100000,
    },
    season: {
      alipay: 26.99,
      paypal: 0,
      flow: 100000,
    },
    year: {
      alipay: 99.99,
      paypal: 0,
      flow: 100000,
    },
  };
  return knex('webguiSetting').insert({
    key: 'payment',
    value: JSON.stringify(value),
  });
}).then();

exports.getSetting = (req, res) => {
  knex('webguiSetting').select().where({
    key: 'system',
  }).then(success => {
    if(!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0];
  }).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.modifySetting = (req, res) => {
  const settings = req.body.settings;
  knex('webguiSetting').update({
    value: JSON.stringify(settings)
  }).where({
    key: 'system',
  }).then(success => {
    return res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getPayment = (req, res) => {
  knex('webguiSetting').select().where({
    key: 'payment',
  }).then(success => {
    if(!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value;
  }).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.modifyPayment = (req, res) => {
  const data = req.body.data;
  knex('webguiSetting').update({
    value: JSON.stringify(data)
  }).where({
    key: 'payment',
  }).then(success => {
    return res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};