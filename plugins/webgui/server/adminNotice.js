const knex = appRequire('init/knex').knex;

exports.getNotice = async (req, res) => {
  try {
    const noticesWithoutGroup = await knex('notice').where({ group: 0 });
    const noticesWithGroup = await knex('notice').select([
      'notice.id as id',
      'notice.title as title',
      'notice.content as content',
      'notice.time as time',
      'notice.group as group',
      'notice.autopop as autopop',
      knex.raw('GROUP_CONCAT(notice_group.groupId) as groupIds'),
    ])
    .innerJoin('notice_group', 'notice.id', 'notice_group.noticeId')
    .where('notice.group', '>', 0)
    .groupBy('notice.id');
    const notices = [...noticesWithoutGroup, ...noticesWithGroup ].map(m => {
      if(m.group) {
        m.groupIds = m.groupIds.split(',').map(m => +m);
      }
      return m;
    }).sort((a, b) => b.time - a.time);
    return res.send(notices);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getOneNotice = async (req, res) => {
  try {
    const id = req.params.noticeId;
    const noticeInfo = await knex('notice').where({
      id,
    }).then(success => success[0]);
    if(!noticeInfo) {
      return Promise.reject(new Error('notice not found'));
    }
    if(noticeInfo.group) {
      const groups = await knex('notice_group').where({
        noticeId: noticeInfo.id,
      }).then(success => success.map(m => m.groupId));
      noticeInfo.groups = groups;
    }
    res.send(noticeInfo);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.addNotice = async (req, res) => {
  try {
    const title = req.body.title;
    const content = req.body.content;
    const group = +req.body.group;
    const groups = req.body.groups;
    const autopop = req.body.autopop;
    const [ id ] = await knex('notice').insert({
      title,
      content,
      time: Date.now(),
      group,
      autopop,
    });
    if(group && groups.length) {
      await knex('notice_group').insert(groups.map(groupId => {
        return {
          noticeId: id,
          groupId,
        };
      }));
    }
    res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.editNotice = async (req, res) => {
  try {
    const id = req.params.noticeId;
    const title = req.body.title;
    const content = req.body.content;
    const group = +req.body.group;
    const groups = req.body.groups;
    const autopop = req.body.autopop;
    await knex('notice').update({
      title,
      content,
      time: Date.now(),
      group,
      autopop
    }).where({
      id,
    });
    if(group) {
      const currentGroups = await knex('notice_group').where({
        noticeId: id,
      }).then(success => success.map(m => m.groupId));
      for(const groupId of currentGroups) {
        if(!groups.includes(groupId)) {
          await knex('notice_group').delete().where({
            noticeId: id,
            groupId,
          });
        }
      }
      for(const groupId of groups) {
        if(!currentGroups.includes(groupId)) {
          await knex('notice_group').insert({
            noticeId: id,
            groupId,
          });
        }
      }
    }
    return res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
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
