const knex = appRequire('init/knex').knex;

const add = async accountId => {
  const servers = await knex('server').select();
  const accountInfo = await knex('account_plugin').where({ id: accountId }).then(s => s[0]);
  const addAccountFlow = async (server, accountId) => {
    const accountFlowInfo = await knex('account_flow').where({ serverId: server.id, accountId }).then(s => s[0]);
    if(accountFlowInfo) { return; }
    await knex('account_flow').insert({
      serverId: server.id,
      accountId,
      port: accountInfo.port + server.shift,
      nextCheckTime: Date.now(),
    });
  };
  await Promise.all(servers.map(server => {
    return addAccountFlow(server, accountId);
  }));
  return;
};

const del = async accountId => {
  await knex('account_flow').delete().where({ accountId });
  return;
};

const edit = async accountId => {
  const servers = await knex('server').select();
  const accountInfo = await knex('account_plugin').where({ id: accountId }).then(s => s[0]);
  await Promise.all(servers.map(server => {
    return knex('account_flow').update({
      port: accountInfo.port + server.shift,
      nextCheckTime: Date.now(),
    }).where({
      serverId: server.id,
      accountId,
    });
  }));
  return;
};

const server = async serverId => {
  const server = await knex('server').where({ id: serverId }).then(s => s[0]);
  const accounts = await knex('account_plugin').where({});
  for(account of accounts) {
    const exists = await knex('account_flow').where({
      serverId,
      accountId: account.id
    }).then(s => s[0]);
    if(!exists) {
      await knex('account_flow').insert({
        serverId: server.id,
        accountId: account.id,
        port: account.port + server.shift,
        nextCheckTime: Date.now(),
      });
    } else {
      await knex('account_flow').update({
        port: account.port + server.shift,
        nextCheckTime: Date.now(),
      }).where({
        serverId: server.id,
        accountId: account.id,
      });
    }
  }
};

exports.add = add;
exports.del = del;
exports.edit = edit;
exports.addServer = server;
exports.editServer = server;