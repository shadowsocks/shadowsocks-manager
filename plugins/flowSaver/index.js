const log4js = require('log4js');
const logger = log4js.getLogger('flowSaver');
appRequire('plugins/flowSaver/server');
appRequire('plugins/flowSaver/flow');
appRequire('plugins/flowSaver/generateFlow');
const accountFlow = appRequire('plugins/account/accountFlow');
const cron = appRequire('init/cron');
const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const minute = 1;
const time = minute * 60 * 1000;

let accountInfo = {};

const updateAccountInfo = async () => {
  const accounts = await knex('account_plugin').select().where({});
  accountInfo = {};
  accounts.forEach(account => {
    accountInfo[account.port] = account.id;
  });
  return;
};

const saveFlow = async () => {
  try {
    const servers = await knex('server').select(['id', 'name', 'host', 'port', 'password', 'shift']);
    await updateAccountInfo();
    const saveServerFlow = async server => {
      const lastestFlow = await knex('saveFlow').select(['time']).where({
        id: server.id,
      }).orderBy('time', 'desc').limit(1);
      if(lastestFlow.length === 0 || Date.now() - lastestFlow[0].time >= time) {
        const options = {
          clear: true,
        };
        let flow = await manager.send({
          command: 'flow',
          options,
        }, {
          host: server.host,
          port: server.port,
          password: server.password,
        });
        flow = flow.map(f => {
          return {
            id: server.id,
            accountId: accountInfo[f.port - server.shift] || 0,
            port: f.port,
            flow: f.sumFlow,
            time: Date.now(),
          };
        }).filter(f => {
          return f.flow > 0;
        });
        if(flow.length === 0) {
          return;
        }
        flow.forEach(async f => {
          await accountFlow.updateFlow(f.id, f.accountId, f.flow);
        });
        for(let i = 0; i < Math.ceil(flow.length / 50); i++) {
          const insertFlow = flow.slice(i * 50, i * 50 + 50);
          await knex('saveFlow').insert(insertFlow).catch();
          logger.info(`[server: ${ server.id }] insert ${ insertFlow.length } flow`);
        }
      }
    };
    for(const server of servers) {
      await saveServerFlow(server).catch(err => {
        logger.error(`[server: ${ server.id }] save flow error`);
      });
    }
  } catch(err) {
    logger.error(err);
    return;
  }
};

cron.minute(() => {
  saveFlow();
}, 'SaveFlow', 1);
