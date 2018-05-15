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

const getRefCodeAndPaging = async (opt) => {
  const page = opt.page || 1;
  const pageSize = opt.pageSize || 20;
  let count = knex('webgui_ref_code').select();
  let code = knex('webgui_ref_code').select([
    'webgui_ref_code.code as code',
    'user.email as email',
    'webgui_ref_code.visit as visit',
    'webgui_ref_code.maxUser as maxUser',
    knex.raw('count(webgui_ref.codeId) as count'),
  ])
  .leftJoin('webgui_ref', 'webgui_ref_code.id', 'webgui_ref.codeId')
  .leftJoin('user', 'webgui_ref_code.sourceUserId', 'user.id')
  .groupBy('webgui_ref_code.id');
  
  count = await count.count('id as count').then(success => success[0].count);
  code = await code.orderBy('webgui_ref_code.time', 'DESC').limit(pageSize).offset((page - 1) * pageSize);
  const maxPage = Math.ceil(count / pageSize);
  return {
    total: count,
    page,
    maxPage,
    pageSize,
    code,
  };
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

const getRefUserAndPaging = async opt => {
  const page = opt.page || 1;
  const pageSize = opt.pageSize || 20;
  let count = knex('webgui_ref').select();
  let user = knex('webgui_ref').select([
    'webgui_ref_code.code as code',
    'u1.email as sourceUser',
    'u2.email as user',
    'webgui_ref.time as time',
  ]).leftJoin('webgui_ref_code', 'webgui_ref.codeId', 'webgui_ref_code.id')
  .leftJoin('user as u1', 'webgui_ref_code.sourceUserId', 'u1.id')
  .leftJoin('user as u2', 'webgui_ref.userId', 'u2.id');
  
  count = await count.count('id as count').then(success => success[0].count);
  user = await user.orderBy('webgui_ref.time', 'DESC').limit(pageSize).offset((page - 1) * pageSize);
  const maxPage = Math.ceil(count / pageSize);
  return {
    total: count,
    page,
    maxPage,
    pageSize,
    user,
  };
};

exports.getRefCode = getRefCode;
exports.getRefUser = getRefUser;
exports.getRefCodeAndPaging = getRefCodeAndPaging;
exports.getRefUserAndPaging = getRefUserAndPaging;