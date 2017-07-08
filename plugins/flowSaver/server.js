const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');

const add = (name, host, port, password, method) => {
  return knex('server').insert({
    name,
    host,
    port,
    password,
    method,
  });
};

const del = (id) => {
  return knex.transaction(trx => {
    return knex('server').transacting(trx).where({ id }).delete()
    .then(() => {
      return knex('saveFlow').transacting(trx).where({ id }).delete();
    })
    .then(trx.commit)
    .catch(trx.rollback);
  });
};

const edit = (id, name, host, port, password, method, scale = 1) => {
  return knex('server').where({ id }).update({
    name,
    host,
    port,
    password,
    method,
    scale,
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
    'scale'
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
