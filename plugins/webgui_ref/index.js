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

const visitRefCode = async code => {
  await knex('webgui_ref_code').where({ code }).increment('visit', 1);
};

const addRefUser = async (code, userId) => {
  try {
    const codeInfo = (await knex('webgui_ref_code').where({ code }))[0];
    if(!codeInfo) { return; }
    await knex('webgui_ref').insert({
      codeId: codeInfo.id,
      userId,
      time: Date.now(),
    });
  } catch(err) {
    console.error(err);
  }
};

const getUserRefCode = async userId => {
  const exists = await knex('webgui_ref_code').where({ sourceUserId: userId });
  if(exists.length === 0) {
    await addRefCode(userId, 3);
  }
  const code = await knex('webgui_ref_code').select(['code']).where({ sourceUserId: userId });
  return code;
};

exports.addRefCode = addRefCode;
exports.visitRefCode = visitRefCode;
exports.addRefUser = addRefUser;
exports.getUserRefCode = getUserRefCode;