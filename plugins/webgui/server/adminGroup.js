const group = appRequire('plugins/group/index');
const knex = appRequire('init/knex').knex;

exports.getGroups = (req, res, next) => {
  group.getGroupsAndUserNumber().then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getOneGroup = (req, res, next) => {
  const id = +req.params.id;
  group.getOneGroup(id).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.addGroup = async (req, res) => {
  try {
    const name = req.body.name;
    const comment = req.body.comment;
    const order = req.body.order ? JSON.stringify(req.body.order) : null;
    const multiAccount = !!req.body.multiAccount;
    const notices = req.body.notices;
    const [ id ] = await group.addGroup(name, comment, order, multiAccount);
    const ids = await knex('notice').where({ group: 1 }).then(success => success.map(m => m.id));
    for(const noticeId of notices) {
      if(ids.includes(noticeId)) {
        await knex('notice_group').insert({
          groupId: id,
          noticeId,
        });
      }
    }
    res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.editGroup = async (req, res) => {
  try {
    const id = +req.params.id;
    const name = req.body.name;
    const comment = req.body.comment;
    const order = req.body.order ? JSON.stringify(req.body.order) : null;
    const multiAccount = !!req.body.multiAccount;
    const notices = req.body.notices;
    await group.editGroup(id, name, comment, order, multiAccount);
    const ids = await knex('notice').where({ group: 1 }).then(success => success.map(m => m.id));
    const currentIds = await knex('notice_group').where({
      groupId: id,
    }).then(success => success.map(m => m.noticeId));
    for(const noticeId of notices) {
      if(!currentIds.includes(noticeId) && ids.includes(noticeId)) {
        await knex('notice_group').insert({
          groupId: id,
          noticeId,
        });
      }
    }
    for(noticeId of currentIds) {
      if(!notices.includes(noticeId)) {
        await knex('notice_group').delete().where({
          groupId: id,
          noticeId,
        });
      }
    }

    res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.deleteGroup = (req, res, next) => {
  const id = +req.params.id;
  group.deleteGroup(id).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.setUserGroup = (req, res, next) => {
  const groupId = +req.params.groupId;
  const userId = +req.params.userId;
  group.setUserGroup(groupId, userId).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};
