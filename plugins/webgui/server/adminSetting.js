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
  };
  return knex('webguiSetting').insert({
    key: 'system',
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
