const knex = appRequire('init/knex').knex;
const config = appRequire('services/config').all();

const { websiteId } = config.plugins.webgui_crisp;

const getToken = async (userId) => {
  const user = await knex('user').where({ id: userId }).then(s => s[0]);
  if(user) {
    return user.crisp;
  }
};

const getUserToken = async (req, res) => {
  const userId = req.session.user;
  try {
    const token = await getToken(userId);
    res.send({ token });
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

const setToken = async (userId, token) => {
  await knex('user').update({ crisp: token }).where({ id: userId });
};

const setUserToken = async (req, res) => {
  const userId = req.session.user;
  const token = req.body.token;
  try {
    await setToken(userId, token);
    res.send({ token });
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getUserToken = getUserToken;
exports.setUserToken = setUserToken;
