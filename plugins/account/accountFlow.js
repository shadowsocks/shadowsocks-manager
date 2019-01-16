const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');

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

const pwd = async (accountId, password) => {
  const servers = await knex('server').select();
  let accountServers = servers;
  const accountInfo = await knex('account_plugin').where({ id: accountId }).then(s => s[0]);
  if(accountInfo.server) {
    accountServers = servers.filter(f => {
      return JSON.parse(accountInfo.server).indexOf(f.id) >= 0;
    });
  }
  accountServers.forEach(server => {
    if(server.type === 'WireGuard') {
      let publicKey = accountInfo.key;
      if(!publicKey) {
        return;
      }
      if(publicKey.includes(':')) {
        publicKey = publicKey.split(':')[0];
      }
      manager.send({
        command: 'pwd',
        port: accountInfo.port + server.shift,
        password: publicKey,
      }, {
        host: server.host,
        port: server.port,
        password: server.password,
      });
    } else {
      manager.send({
        command: 'pwd',
        port: accountInfo.port + server.shift,
        password,
      }, {
        host: server.host,
        port: server.port,
        password: server.password,
      });
    }
  });
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
  for(const account of accounts) {
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

const updateFlow = async (serverId, accountId, flow) => {
  const exists = await knex('account_flow').where({
    serverId,
    accountId,
  }).then(success => success[0]);
  if(!exists) { return; }
  await knex('account_flow').update({
    flow: exists.flow + flow,
    updateTime: Date.now(),
  }).where({
    serverId,
    accountId,
  });
};

exports.add = add;
exports.del = del;
exports.pwd = pwd;
exports.edit = edit;
exports.addServer = server;
exports.editServer = server;
exports.updateFlow = updateFlow;
