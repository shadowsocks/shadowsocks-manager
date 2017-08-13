const knex = appRequire('init/knex').knex;
const serverPlugin = appRequire('plugins/flowSaver/server');
const dns = require('dns');

const getIp = address => {
  return new Promise((resolve, reject) => {
    dns.lookup(address, (err, address, family) => {
      if(err) {
        return reject(err);
      }
      return resolve(address);
    });
  });
};

const newAccount = async (mac, userId, serverId, accountId) => {

};

const getAccount = async (mac, serverId, accountId) => {
  const macAccount = await knex('mac_account').where({ mac }).then(success => success[0]);
  const myServerId = serverId || macAccount.serverId;
  const myAccountId = accountId || macAccount.accountId;
  console.log(myServerId, myAccountId);
  const accounts = await knex('mac_account').select([
    'mac_account.id',
    'mac_account.mac',
    'account_plugin.id as accountId',
    'account_plugin.port',
    'account_plugin.password',
  ])
  .leftJoin('user', 'mac_account.userId', 'user.id')
  .leftJoin('account_plugin', 'mac_account.userId', 'account_plugin.userId');
  const account = accounts.filter(a => {
    return a.accountId === myAccountId;
  })[0];
  const servers = await serverPlugin.list();
  const server = servers.filter(s => {
    return s.id === myServerId;
  })[0];
  const address = await getIp(server.host);
  return {
    address,
    port: account.port,
    password: account.password,
    method: server.method,
  };
};

const editAccount = async (id, mac, serverId, accountId) => {
  
};

const deleteAccount = async id => {};

exports.getAccount = getAccount;