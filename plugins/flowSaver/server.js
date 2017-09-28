const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const checkAccount = appRequire('plugins/account/checkAccount');

const add = options => {
  const { name, host, port, password, method, scale = 1, comment = '', shift = 0 } = options;
  return knex('server').insert({
    name,
    comment,
    host,
    port,
    password,
    method,
    scale,
    shift,
  });
};

const del = (id) => {
  return knex.transaction(trx => {
    return knex('server').transacting(trx).where({ id }).delete()
    .then(() => knex('saveFlow').transacting(trx).where({ id }).delete())
    .then(trx.commit)
    .catch(trx.rollback);
  });
};

const edit = options => {
  const { id, name, host, port, password, method, scale = 1, comment = '', shift = 0 } = options;
  checkAccount.deleteCheckAccountTimeServer(id);
  return knex('server').where({ id }).update({
    name,
    comment,
    host,
    port,
    password,
    method,
    scale,
    shift,
  });
};

const list = async (options = {}) => {
  const serverList = await knex('server').select([
    'id',
    'name',
    'host',
    'port',
    'password',
    'method',
    'scale',
    'comment',
    'shift',
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
        return { status: success.version, index };
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
    });
  }
  return serverList;
};

exports.add = add;
exports.del = del;
exports.edit = edit;
exports.list = list;
