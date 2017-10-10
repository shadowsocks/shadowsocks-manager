const user = appRequire('plugins/user/index');

exports.getUsers = (req, res) => {
  const page = +req.query.page || 1;
  const pageSize = +req.query.pageSize || 20;
  const search = req.query.search || '';
  const sort = req.query.sort || 'id_asc';
  user.getUserAndPaging({
    page,
    pageSize,
    search,
    sort,
  }).then(success => {
    success.users = success.users.map(m => {
      return {
        id: m.id,
        email: m.email,
        lastLogin: m.lastLogin,
        username: m.username,
        port: m.port,
      };
    });
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.addUser = (req, res) => {
  req.checkBody('email', 'Invalid email').notEmpty();
  req.checkBody('password', 'Invalid password').notEmpty();
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const email = req.body.email;
      const password = req.body.password;
      return user.add({
        username: email,
        email,
        password,
        type: 'normal',
      });
    }
    result.throw();
  }).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};