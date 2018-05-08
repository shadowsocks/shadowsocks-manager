const knex = appRequire('init/knex').knex;

const addRefCode = async (userId, max) => {
  const code = Math.random().toString().substr(2, 10);
  await knex('webgui_ref_code').insert({
    code,
    sourceUserId: userId,
    maxUser: max,
    time: Date.now(),
  });
};

const visitRefCode = async code => {
  await knex('webgui_ref_code')
  .where({ code })
  .increment('visit', 1);
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

(async () => {
  const number = await knex('webgui_ref_code').where({}).then(s => s.length);
  if(number === 0) {
    await addRefCode(2, 5);
  };
})();

exports.addRefCode = addRefCode;
exports.visitRefCode = visitRefCode;
exports.addRefUser = addRefUser;