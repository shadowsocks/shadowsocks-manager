const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const accountFlow = appRequire('plugins/account/accountFlow');
const moment = require('moment');

const add = async options => {
  const { type = 'Shadowsocks', name, comment = '', host, port, password, method, scale = 1, shift = 0, resetday = 1, monthflow = 0, key, net, wgPort, } = options;
  const [serverId] = await knex('server').insert({
    type,
    name,
    comment,
    host,
    port,
    password,
    method,
    scale,
    shift,
    monthflow,
    resetday,
    key,
    net,
    wgPort,
  });
  accountFlow.addServer(serverId);
  return [serverId];
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
  const { id, type = 'Shadowsocks', name, host, port, password, method, scale = 1, comment = '', shift = 0, resetday = 1, monthflow = 0, key, net, wgPort, check, } = options;
  const serverInfo = await knex('server').where({ id }).then(s => s[0]);
  if (serverInfo.shift !== shift) {
    const accounts = await knex('account_plugin').where({});
    (async server => {
      for (account of accounts) {
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
  if (check) { accountFlow.editServer(id); }
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
    monthflow,
    resetday,
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
    'monthflow',
    'resetday',
    'key',
    'net',
    'wgPort',
  ]).orderBy('name');
  if (options.status) {
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
    for (let i = 0; i < serverList.length; i++) {
      let server = serverList[i];
      serverStatus.push(getServerStatus(server, i));
      //开始日期
      const nowday = moment().format('D');
      const now = moment().valueOf();
      //上次重置时间
      let last = moment().subtract(1, 'months').valueOf();
      let lastday = moment().subtract(1, 'months').endOf('month')
      //重置日期在当前日期后面 取上个月的
      if (server.resetday > nowday) {
        lastday = moment().subtract(1, 'months').endOf('month').format('D');
        //上个月最后一天小于重置天
        if (lastday < server.resetday) {
          last = moment().subtract(1, 'months').endOf('month').startOf('day').valueOf();
        } else {
          last = moment(moment().subtract(1, 'months').format('YYYY-MM') + '-' + (server.resetday < 10 ? '0' + server.resetday : server.resetday)).startOf('day').valueOf();
        }
      } else {
        last = moment(moment().format('YYYY-MM') + '-' + (server.resetday < 10 ? '0' + server.resetday : server.resetday)).startOf('day').valueOf();
      }
      server['useflow'] = await knex('saveFlowHour')
        .sum(`flow as sumFlow`)
        .where({ id: server.id })
        .whereBetween(`time`, [last, now]).then(res => res[0].sumFlow || 0);
    }
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
