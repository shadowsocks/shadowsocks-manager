const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');

const add = options => {
  const { name, host, port, password } = options;
  return knex('server').insert({
    name,
    host,
    port,
    password
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
  const { id, name, host, port, password } = options;
  return knex('server').where({ id }).update({
    name,
    host,
    port,
    password
  });
};

const list = async (options = {}) => {
  const serverList = await knex('server').select([
    'id',
    'name',
    'host',
    'port',
    'password',
    'method'
  ]).orderBy('name');
  return serverList;
};

exports.add = add;
exports.del = del;
exports.edit = edit;
exports.list = list;
