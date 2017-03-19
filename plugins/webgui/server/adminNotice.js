const knex = appRequire('init/knex').knex;

exports.getNotice = (req, res) => {
  knex('notice').select().orderBy('time', 'desc').then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getOneNotice = (req, res) => {
  const id = req.params.noticeId;
  knex('notice').select().where({
    id,
  }).then(success => {
    if(!success.length) {
      return Promise.reject(new Error('notice not found'));
    }
    return res.send(success[0]);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.addNotice = (req, res) => {
  const title = req.body.title;
  const content = req.body.content;
  knex('notice').insert({
    title,
    content,
    time: Date.now(),
  }).then(success => {
    return res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.editNotice = (req, res) => {
  const id = req.params.noticeId;
  const title = req.body.title;
  const content = req.body.content;
  knex('notice').update({
    title,
    content,
    time: Date.now(),
  }).where({
    id,
  }).then(success => {
    return res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.deleteNotice = (req, res) => {
  const id = req.params.noticeId;
  knex('notice').delete().where({
    id,
  }).then(success => {
    return res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};