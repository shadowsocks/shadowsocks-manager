const knex = appRequire('init/knex').knex;

const addRefCode = async (userId, max = 3) => {
  const code = Math.random().toString().substr(2, 10);
  await knex('webgui_ref_code').insert({
    code,
    sourceUserId: userId,
    maxUser: max,
    time: Date.now(),
  });
};

const getRefSetting = async () => {
  const setting = await knex('webguiSetting').select().where({
    key: 'webgui_ref',
  }).then(success => {
    if(!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value;
  });
  return setting;
};

const getRefCode = async userId => {
  const setting = await getRefSetting();
  const exists = await knex('webgui_ref_code').where({ sourceUserId: userId });
  if(exists.length < setting.refNumber) {
    for(let i = 0; i < setting.refNumber - exists.length; i++) {
      await addRefCode(userId, setting.refUserNumber);
    }
  }
  const code = await knex('webgui_ref_code').select([
    'webgui_ref_code.code as code',
    'webgui_ref_code.maxUser as maxUser',
    knex.raw('count(webgui_ref.codeId) as count'),
  ]).where({ sourceUserId: userId })
  .leftJoin('webgui_ref', 'webgui_ref_code.id', 'webgui_ref.codeId')
  .groupBy('webgui_ref_code.id');
  return code;
};

const getRefUser = async userId => {
  const user = await knex('webgui_ref').select([
    'webgui_ref_code.code as code',
    'user.email as email',
    'webgui_ref.time as time',
  ])
  .where({ 'webgui_ref_code.sourceUserId': userId })
  .leftJoin('webgui_ref_code', 'webgui_ref.codeId', 'webgui_ref_code.id')
  .leftJoin('user', 'webgui_ref.userId', 'user.id')
  .orderBy('webgui_ref.time', 'DESC');
  return user;
};

exports.getRefCode = getRefCode;
exports.getRefUser = getRefUser;