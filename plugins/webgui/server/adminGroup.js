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
  group.addGroup(name, comment).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.editGroup = (req, res, next) => {};

exports.deleteGroup = (req, res, next) => {};