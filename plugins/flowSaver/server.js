const knex = appRequire('init/knex').knex;

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

const list = () => {
  return knex('server').select(['id', 'name', 'host', 'port', 'password', 'method', 'scale']).orderBy('name');
};

exports.add = add;
exports.del = del;
exports.edit = edit;
exports.list = list;
