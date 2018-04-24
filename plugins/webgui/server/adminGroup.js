const group = appRequire('plugins/group/index');

exports.getGroups = (req, res, next) => {
  group.getGroups().then(success => {
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

exports.addGroup = (req, res, next) => {
  const name = req.body.name;
  const comment = req.body.comment;
  const showNotice = !!req.body.showNotice;
  group.addGroup(name, comment, showNotice).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.editGroup = (req, res, next) => {
  const id = +req.params.id;
  const name = req.body.name;
  const comment = req.body.comment;
  const showNotice = !!req.body.showNotice;
  group.editGroup(id, name, comment, showNotice).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
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