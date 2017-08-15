const knex = appRequire('init/knex').knex;

const setDefaultValue = (key, value) => {
  knex('webguiSetting').select().where({
    key,
  }).then(success => {
    if(success.length) {
      return;
    }
    return knex('webguiSetting').insert({
      key,
      value: JSON.stringify(value),
    });
  }).then();
};
setDefaultValue('account', {
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
});
setDefaultValue('base', {
  title: 'Shadowsocks-Manager',
  themeAccent: 'pink',
  themePrimary: 'blue',
  serviceWorker: false,
});
setDefaultValue('payment', {
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
});
setDefaultValue('mail', {
  code: {
    title: 'ss验证码',
    content: '欢迎新用户注册，\n您的验证码是：${code}',
  },
  reset: {
    title: 'ss密码重置',
    content: '请访问下列地址重置您的密码：\n${address}',
  },
  order: {
    title: 'ss订单支付成功',
    content: '暂时没想好这里要写什么',
  },
});

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

exports.getAccount = (req, res) => {
  knex('webguiSetting').select().where({
    key: 'account',
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

exports.modifyAccount = (req, res) => {
  const data = req.body.data;
  knex('webguiSetting').update({
    value: JSON.stringify(data)
  }).where({
    key: 'account',
  }).then(success => {
    return res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getBase = (req, res) => {
  knex('webguiSetting').select().where({
    key: 'base',
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

exports.modifyBase = (req, res) => {
  const data = req.body.data;
  knex('webguiSetting').update({
    value: JSON.stringify(data)
  }).where({
    key: 'base',
  }).then(success => {
    return res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getMail = (req, res) => {
  const type = req.query.type;
  knex('webguiSetting').select().where({
    key: 'mail',
  }).then(success => {
    if(!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value[type];
  }).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.modifyMail = (req, res) => {
  const type = req.body.type;
  const title = req.body.title;
  const content = req.body.content;
  knex('webguiSetting').select().where({
    key: 'mail',
  }).then(success => {
    if(!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value;
  }).then(success => {
    success[type].title = title;
    success[type].content = content;
    return knex('webguiSetting').update({
      value: JSON.stringify(success)
    }).where({
      key: 'mail',
    });
  }).then(success => {
    return res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};