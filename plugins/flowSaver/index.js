'use strict';

const path = require('path');
appRequire('plugins/flowSaver/db/server');
appRequire('plugins/flowSaver/db/saveFlow');
appRequire('plugins/flowSaver/server');
appRequire('plugins/flowSaver/flow');
const knex = appRequire('init/knex').knex;
const manager = appRequire('services/manager');
const later = require('later');
const moment = require('moment');
later.date.localTime();
const minute = 1;
const sched0 = later.parse.recur().every(minute).minute();
const time = minute * 60 * 1000;

const saveFlow = async () => {
  try {
    const servers = await knex('server').select(['name', 'host', 'port', 'password']);
    servers.forEach(async server => {
      const lastestFlow = await knex('saveFlow').select(['time']).where({
        name: server.name,
      }).orderBy('time', 'desc').limit(1);
      if(lastestFlow.length === 0 || Date.now() - lastestFlow[0].time >= time) {
        const options = {
          clear: true,
        };
        const flow = await manager.send({
          command: 'flow',
          options: options,
        }, {
          host: server.host,
          port: server.port,
          password: server.password,
        });
        if(flow.length === 0) {
          return;
        }
        await knex('saveFlow').insert(flow.map(f => {
          return {
            name: server.name,
            port: f.port,
            flow: f.sumFlow,
            time: Date.now(),
          };
        }).filter(f => {
          return f.flow > 0;
        }));
      }
    });
  } catch(err) {
    console.log(err);
  }
};

saveFlow();
const timer0 = later.setInterval(() => {
  saveFlow();
}, sched0);
