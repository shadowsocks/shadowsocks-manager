const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
const knex = appRequire('init/knex').knex;
const config = appRequire('services/config').all();
if(config.plugins.webgui.gcmAPIKey && config.plugins.webgui.gcmSenderId) {
  webpush.setGCMAPIKey(config.plugins.webgui.gcmAPIKey);
  webpush.setVapidDetails(
    'mailto:xxx@ooo.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );

  exports.pushMessage = async (title, options) => {
    const users = await knex('push').select();
    const arr = [];
    users.filter(f => f.userId === 1).forEach(user => {
      const promise = webpush.sendNotification({
        endpoint: user.endpoint,
        keys: {
          auth: user.auth,
          p256dh: user.p256dh,
        }
      }, JSON.stringify({ title, options })).catch(() => {
        return knex('push').delete().where({ endpoint: user.endpoint });
      });
      arr.push(promise);
    });
    await Promise.all(arr);
    return;
  };

  const insertPushList = async (userId, data) => {
    const push = await knex('push').select().where({
      endpoint: data.endpoint,
    }).then(success => success[0]);
    if(push) {
      await knex('push').update({
        userId,
        auth: data.keys.auth,
        p256dh: data.keys.p256dh,
      }).where({ endpoint: data.endpoint });
    } else {
      await knex('push').insert({
        userId,
        endpoint: data.endpoint,
        auth: data.keys.auth,
        p256dh: data.keys.p256dh,
      });
    }
    return;
  };

  exports.client = (req, res) => {
    const data = req.body.data;
    if(!req.session.type || req.session.type === 'normal') {
      return knex('push').delete().where({ endpoint: data.endpoint })
      .then(() => {
        res.send('success');
      });
    }
    const userId = req.session.user;
    insertPushList(userId, data).then(success => {
      res.send('success');
    }).catch(err => {
      console.log(err);
      res.status(403).end();
    });
  };
  exports.deleteClient = (req, res) => {
    if(!req.query.data) {
      return res.send('success');
    }
    const data = JSON.parse(req.query.data);
    return knex('push').delete().where({ endpoint: data.endpoint })
    .then(() => {
      res.send('success');
    })
    .catch(err => {
      console.log(err);
      res.status(403).end();
    });
  };

} else {

  exports.pushMessage = () => Promise.resolve();
  exports.client = () => {};
}
