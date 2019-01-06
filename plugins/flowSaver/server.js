const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const accountFlow = appRequire('plugins/account/accountFlow');

const add = async options => {
  const {
    type = 'Shadowsocks',
    name,
    comment = '',
    host,
    port,
    password,
    method,
    scale = 1,
    shift = 0,
    key,
    net,
    wgPort,
  } = options;
  const [ serverId ] = await knex('server').insert({
    type,
    name,
    comment,
    host,
    port,
    password,
    method,
    scale,
    shift,
    key,
    net,
    wgPort,
  });
  accountFlow.addServer(serverId);
  return [ serverId ];
};

const del = (id) => {
  return knex.transaction(trx => {
    return knex('server').transacting(trx).where({ id }).delete()
    .then(() => knex('saveFlow').transacting(trx).where({ id }).delete())
    .then(trx.commit)
    .catch(trx.rollback);
  });
};

const edit = async options => {
  const {
    id,
    type = 'Shadowsocks',
    name, host, port, password, method, scale = 1, comment = '', shift = 0,
    key, net, wgPort,
    check,
  } = options;
  const serverInfo = await knex('server').where({ id }).then(s => s[0]);
  if(serverInfo.shift !== shift) {
    const accounts = await knex('account_plugin').where({});
    (async server => {
      for(account of accounts) {
        await manager.send({
          command: 'del',
          port: account.port + server.shift,
        }, {
          host: server.host,
          port: server.port,
          password: server.password,
        }).catch();
      }
    })(serverInfo);
  }
  if(check) { accountFlow.editServer(id); }
  return knex('server').where({ id }).update({
    type,
    name,
    comment,
    host,
    port,
    password,
    method,
    scale,
    shift,
    key,
    net,
    wgPort,
  });
};

const list = async (options = {}) => {
  const serverList = await knex('server').select([
    'id',
    'type',
    'name',
    'host',
    'port',
    'password',
    'method',
    'scale',
    'comment',
    'shift',
    'key',
    'net',
    'wgPort',
  ]).orderBy('name');
  if(options.status) {
    const serverStatus = [];
    const getServerStatus = (server, index) => {
      return manager.send({
        command: 'version',
      }, {
        host: server.host,
        port: server.port,
        password: server.password,
      }).then(success => {
        return { status: success.version, isGfw: success.isGfw, index };
      }).catch(error => {
        return { status: -1, index };
      });
    };
    serverList.forEach((server, index) => {
      serverStatus.push(getServerStatus(server, index));
    });
    const status = await Promise.all(serverStatus);
    status.forEach(f => {
      serverList[f.index].status = f.status;
      serverList[f.index].isGfw = !!f.isGfw;
    });
  }
  return serverList;
};

exports.add = add;
exports.del = del;
exports.edit = edit;
exports.list = list;
