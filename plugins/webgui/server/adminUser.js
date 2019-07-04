const user = appRequire('plugins/user/index');
const refUser = appRequire('plugins/webgui_ref/user');
const account = appRequire('plugins/account/index');
const log4js = require('log4js');
const logger = log4js.getLogger('webgui');

exports.getOneUser = async (req, res) => {
  try {
    const userId = +req.params.userId;
    const userInfo = await user.getOne(userId);
    const userAccount = await account.getAccount();
    userInfo.account = userAccount.filter(f => {
      return f.userId === +userId;
    });
    const ref = await refUser.getRefSourceUser(userId);
    userInfo.ref = ref;
    return res.send(userInfo);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getOneAdmin = (req, res) => {
  const userId = req.params.userId;
  user.getOneAdmin(userId).then(success => {
    return res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getUsers = async (req, res) => {
  try {
    const page = +req.query.page || 1;
    const pageSize = +req.query.pageSize || 20;
    const search = req.query.search || '';
    const sort = req.query.sort || 'id_asc';
    const type = Array.isArray(req.query.type) ? req.query.type : [req.query.type || ''];
    const group = req.adminInfo.id === 1 ? +req.query.group : req.adminInfo.group;
    const result = await user.getUserAndPaging({
      page,
      pageSize,
      search,
      sort,
      type,
      group,
    });
    result.users = result.users.map(m => {
      return {
        id: m.id,
        type: m.type,
        email: m.email,
        lastLogin: m.lastLogin,
        username: m.username,
        port: m.port,
      };
    });
    return res.send(result);
  } catch(err) {
    logger.error(err);
    res.status(403).end();
  }
};

exports.addUser = (req, res) => {
  req.checkBody('email', 'Invalid email').notEmpty();
  req.checkBody('password', 'Invalid password').notEmpty();
  req.checkBody('type', 'Invalid type').isIn(['normal', 'admin']);
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const email = req.body.email;
      const password = req.body.password;
      const group = req.adminInfo.id === 1 ? 0 : req.adminInfo.group;
      const type = req.adminInfo.id === 1 ? req.body.type: 'normal' ;
      return user.add({
        username: email,
        email,
        password,
        type,
        group,
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

exports.editUserComment = (req, res) => {
  const userId = +req.params.userId;
  const comment = req.body.comment;
  user.edit({ id: userId }, { comment }).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};
