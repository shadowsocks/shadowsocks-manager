const knex = appRequire('init/knex').knex;

const getRefCode = async () => {
  const code = await knex('webgui_ref_code').select([
    'webgui_ref_code.code as code',
    'user.email as email',
    'webgui_ref_code.maxUser as maxUser',
    knex.raw('count(webgui_ref.codeId) as count'),
  ])
  .leftJoin('webgui_ref', 'webgui_ref_code.id', 'webgui_ref.codeId')
  .leftJoin('user', 'webgui_ref_code.sourceUserId', 'user.id')
  .groupBy('webgui_ref_code.id')
  .orderBy('webgui_ref_code.time', 'DESC');
  return code;
};

const getRefUser = async () => {
  const user = await knex('webgui_ref').select([
    'webgui_ref_code.code as code',
    'u1.email as sourceUser',
    'u2.email as user',
    'webgui_ref.time as time',
  ]).leftJoin('webgui_ref_code', 'webgui_ref.codeId', 'webgui_ref_code.id')
  .leftJoin('user as u1', 'webgui_ref_code.sourceUserId', 'u1.id')
  .leftJoin('user as u2', 'webgui_ref.userId', 'u2.id')
  .orderBy('webgui_ref.time', 'DESC');
  return user;
};

exports.getRefCode = getRefCode;
exports.getRefUser = getRefUser;