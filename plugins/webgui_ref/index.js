const knex = appRequire('init/knex').knex;

const addRef = async (sourceId, userId) => {
  try {
    const source = (await knex('user').where({ id: +sourceId }))[0];
    const user = (await knex('user').where({ id: +userId }))[0];
    if(!source || !user) { return; }
    await knex('webgui_ref').insert({
      sourceUserId: source.id,
      userId: user.id,
      time: Date.now(),
    });
  } catch(err) {
    console.error(err);
  }
};

exports.addRef = addRef;