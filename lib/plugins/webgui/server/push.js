function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
const knex = appRequire('init/knex').knex;
const config = appRequire('services/config').all();

webpush.setGCMAPIKey(config.plugins.webgui.gcmAPIKey);
webpush.setVapidDetails('mailto:xxx@ooo.com', vapidKeys.publicKey, vapidKeys.privateKey);

exports.pushMessage = (() => {
  var _ref = _asyncToGenerator(function* (title, options) {
    const users = yield knex('push').select();
    const arr = [];
    users.forEach(function (user) {
      const promise = webpush.sendNotification({
        endpoint: user.endpoint,
        keys: {
          auth: user.auth,
          p256dh: user.p256dh
        }
      }, JSON.stringify({ title, options })).catch(function () {
        return knex('push').delete().where({ endpoint: user.endpoint });
      });
      arr.push(promise);
    });
    yield Promise.all(arr);
    return;
  });

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

const insertPushList = (() => {
  var _ref2 = _asyncToGenerator(function* (data) {
    push = yield knex('push').select().where({
      endpoint: data.endpoint
    }).then(function (success) {
      return success[0];
    });
    if (push) {
      yield knex('push').update({
        auth: data.keys.auth,
        p256dh: data.keys.p256dh
      }).where({ endpoint: data.endpoint });
    } else {
      yield knex('push').insert({
        endpoint: data.endpoint,
        auth: data.keys.auth,
        p256dh: data.keys.p256dh
      });
    }
    return;
  });

  return function insertPushList(_x3) {
    return _ref2.apply(this, arguments);
  };
})();

exports.client = (req, res) => {
  const data = req.body.data;
  if (!req.session.type || req.session.type === 'normal') {
    knex('push').delete().where({ endpoint: data.endpoint }).then(() => {
      res.send('success');
    });
    return;
  }
  insertPushList(data).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};