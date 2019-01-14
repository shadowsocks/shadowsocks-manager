const cron = appRequire('init/cron');
const knex = appRequire('init/knex').knex;
const serverManager = appRequire('plugins/telegram/serverManager');
const manager = appRequire('services/manager');
const moment = require('moment');
const log4js = require('log4js');
const logger = log4js.getLogger('telegram');

const getFlow = (host, port, start, end) => {
  return knex('saveFlow').innerJoin('server', 'server.id', 'saveFlow.id')
  .sum('flow as sumFlow')
  .groupBy('saveFlow.port')
  .select(['saveFlow.port as port'])
  .where({
    'server.host': host,
    'server.port': port,
  })
  .whereBetween('time', [start, end]);
};

const saveFlow = async () => {
  try {
    const servers = await serverManager.list();
    const promises = [];
    const saveServerFlow = async server => {
      const lastestFlow = await knex('saveFlow').select(['time']).where({
        id: server.id,
      }).orderBy('time', 'desc').limit(1);
      if(lastestFlow.length === 0 || Date.now() - lastestFlow[0].time >= 60000) {
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
        const insertPromises = [];
        for(let i = 0; i < Math.ceil(flow.length / 50); i++) {
          const insert = knex('saveFlow').insert(flow.slice(i * 50, i * 50 + 50));
          insertPromises.push(insert);
        }
        await Promise.all(insertPromises);
      }
    };
    servers.forEach(server => {
      promises.push(saveServerFlow(server));
    });
    await Promise.all(promises);
  } catch(err) {
    logger.error(err);
    return;
  }
};

cron.minute(() => {
  saveFlow();
}, 'TelegramSaveFlow', 1);

exports.getFlow = getFlow;
