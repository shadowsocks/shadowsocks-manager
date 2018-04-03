const cron = appRequire('init/cron');
const knex = appRequire('init/knex').knex;

const ban = async (serverId, accountId, time) => {
  console.log('ban [' + serverId + '][' + accountId + ']');
  await knex('account_flow').update({
    status: 'ban',
    nextCheckTime: Date.now() + time,
  }).where({
    serverId, accountId,
  });
};

const check = async opt => {
  const { serverId, accountId, time, flow, banTime } = opt;
  const myFlow = await knex('saveFlow')
  .sum('flow as sumFlow')
  .where({
    id: serverId,
    accountId,
  }).where('time', '>', Date.now() - time).then(s => s[0]);
  console.log('flow: ' + myFlow.sumFlow);
  if(myFlow.sumFlow >= flow) {
    await ban(serverId, accountId, banTime);
  }
};

cron.second(() => {
  check({
    serverId: 32,
    accountId: 2,
    time: 3600 * 1000,
    flow: 100 * 1000 * 1000,
    banTime: 600 * 1000,
  });
}, 30);