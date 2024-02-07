const user = appRequire('plugins/user/index');
const refUser = appRequire('plugins/webgui_ref/user');
const account = appRequire('plugins/account/index');
const log4js = require('log4js');
const logger = log4js.getLogger('webgui');
const { body, validationResult } = require('express-validator');

exports.getOneUser = async (req, res) => {
  try {
    const userId = +req.params.userId;
    const userInfo = await user.getOne(userId);
    const userAccount = await account.getAccount();
    userInfo.account = userAccount.filter(f => f.userId === userId);
    const ref = await refUser.getRefSourceUser(userId);
    userInfo.ref = ref;
    res.send(userInfo);
  } catch(err) {
    logger.error(err);
    res.status(403).end();
  }
};

exports.getOneAdmin = async (req, res) => {
  try {
    const userId = req.params.userId;
    const success = await user.getOneAdmin(userId);
    res.send(success);
  } catch(err) {
    logger.error(err);
    res.status(403).end();
  }
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
    result.users = result.users.map(m => ({
      id: m.id,
      type: m.type,
      email: m.email,
      lastLogin: m.lastLogin,
      username: m.username,
      port: m.port,
      alipay: m.alipay,
    }));
    res.send(result);
  } catch(err) {
    logger.error(err);
    res.status(403).end();
  }
};

exports.addUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, type: reqType } = req.body;
    const group = req.adminInfo.id === 1 ? 0 : req.adminInfo.group;
    const type = req.adminInfo.id === 1 ? reqType : 'normal';
    const success = await user.add({ username: email, email, password, type, group });
    res.send(success);
  } catch(err) {
    logger.error(err);
    res.status(403).end();
  }
};

exports.editUserComment = async (req, res) => {
  try {
    const userId = +req.params.userId;
    const { comment } = req.body;
    await user.edit({ id: userId }, { comment });
    res.send('success');
  } catch(err) {
    logger.error(err);
    res.status(403).end();
  }
};
