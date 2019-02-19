const knex = appRequire('init/knex').knex;
const account = appRequire('plugins/account/index');

const getFlowPack = async (accountId, start, end) => {
  const flowPacks = await knex('webgui_flow_pack').where({ accountId }).whereBetween('createTime', [ start, end ]);
  if(!flowPacks.length) { return 0; }
  return flowPacks.reduce((a, b) => {
    return { flow: a.flow + b.flow };
  }, { flow: 0 }).flow;
};

exports.getFlowPack = getFlowPack;
