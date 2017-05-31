const log4js = require('log4js');
const logger = log4js.getLogger('system');
const cron = appRequire('init/cron');
const dgram = require('dgram');
const client = dgram.createSocket('udp4');

const config = appRequire('services/config').all();
const host = config.shadowsocks.address.split(':')[0];
const port = +config.shadowsocks.address.split(':')[1];

const knex = appRequire('init/knex').knex;

const moment = require('moment');

let shadowsocksType = 'libev';
let lastFlow;

const sendPing = () => {
  client.send(new Buffer('ping'), port, host);
};

let existPort = [];
let existPortUpdatedAt = Date.now();
const setExistPort = flow => {
  existPort = [];
  for(const f in flow) {
    existPort.push(+f);
  }
  existPortUpdatedAt = Date.now();
};

const connect = () => {
  client.on('message', async (msg, rinfo) => {
    const msgStr = new String(msg);
    if(msgStr.substr(0, 4) === 'pong') {
      shadowsocksType = 'python';
    } else if(msgStr.substr(0, 5) === 'stat:') {
      let flow = JSON.parse(msgStr.substr(5));
      setExistPort(flow);
      const realFlow = compareWithLastFlow(flow, lastFlow);
      logger.info(`Receive flow from shadowsocks: (${ shadowsocksType })\n${JSON.stringify(realFlow, null, 2)}`);
      lastFlow = flow;
      const insertFlow = Object.keys(realFlow).map(m => {
        return {
          port: +m,
          flow: +realFlow[m],
          time: Date.now(),
        };
      }).filter(f => {
        return f.flow > 0;
      });
      const accounts = await knex('account').select([ 'port' ]);
      insertFlow.forEach(fe => {
        const account = accounts.filter(f => {
          return fe.port === f.port;
        })[0];
        if(!account) {
          sendMessage(`remove: {"server_port": ${ fe.port }}`);
        }
      });
      if(insertFlow.length > 0) {
        knex('flow').insert(insertFlow).then();
      }
    };
  });

  client.on('error', err => {
    logger.error(`client error: `, err);
  });
  client.on('close', () => {
    logger.error(`client close`);
  });
};

const sendMessage = (message) => {
  const randomTraceNumber = Math.random().toString().substr(2,6);
  logger.info(`[${ randomTraceNumber }] Send to shadowsocks: ${ message }`);
  client.send(message, port, host);
  return Promise.resolve('ok');
};

const startUp = async () => {
  client.send(new Buffer('ping'), port, host);
  if(config.runShadowsocks === 'python') {
    sendMessage(`remove: {"server_port": 65535}`);
  }
  const accounts = await knex('account').select([ 'port', 'password' ]);
  accounts.forEach(f => {
    sendMessage(`add: {"server_port": ${ f.port }, "password": "${ f.password }"}`);
  });
};

const resend = async () => {
  if(Date.now() - existPortUpdatedAt >= 180 * 1000) {
    existPort = [];
  }
  const accounts = await knex('account').select([ 'port', 'password' ]);
  accounts.forEach(f => {
    if(existPort.indexOf(f.port) < 0) {
      sendMessage(`add: {"server_port": ${ f.port }, "password": "${ f.password }"}`);
    }
  });
};

const compareWithLastFlow = (flow, lastFlow) => {
  if(shadowsocksType === 'python') {
    return flow;
  }
  const realFlow = {};
  if(!lastFlow) {
    return flow;
  }
  for(const f in flow) {
    if(lastFlow[f]) {
      realFlow[f] = flow[f] - lastFlow[f];
    } else {
      realFlow[f] = flow[f];
    }
  }
  if(Object.keys(realFlow).map(m => realFlow[m]).sort((a, b) => a > b)[0] < 0) {
    return flow;
  }
  return realFlow;
};

connect();
startUp();
cron.minute(() => {
  resend();
  sendPing();
}, 1);

const checkPortRange = (port) => {
  if(!config.shadowsocks.portRange) { return true; }
  const portRange = config.shadowsocks.portRange.split(',');
  let isInRange = false;
  portRange.forEach(f => {
    if(f.indexOf('-') >= 0) {
      const range = f.trim().split('-');
      if(port >= +range[0] && port <= +range[1]) {
        isInRange = true;
      }
    } else if (port === +f) {
      isInRange = true;
    }
  });
  return isInRange;
};

const addAccount = async (port, password) => {
  try {
    if(!checkPortRange(port)) {
      return Promise.reject('error');
    }
    const insertAccount = await knex('account').insert({
      port,
      password,
    });
    await sendMessage(`add: {"server_port": ${ port }, "password": "${ password }"}`);
    return { port, password };
  } catch(err) {
    return Promise.reject('error');
  }
};

const removeAccount = async (port) => {
  try {
    const deleteAccount = await knex('account').where({
      port,
    }).delete();
    if(deleteAccount <= 0) {
      return Promise.reject('error');
    }
    await knex('flow').where({
      port,
    }).delete();
    await sendMessage(`remove: {"server_port": ${ port }}`);
    return { port };
  } catch(err) {
    return Promise.reject('error');
  }
};

const changePassword = async (port, password) => {
  try {
    const updateAccount = await knex('account').where({port}).update({
      password,
    });
    if(updateAccount <= 0) {
      return Promise.reject('error');
    }
    await sendMessage(`remove: {"server_port": ${ port }}`);
    await sendMessage(`add: {"server_port": ${ port }, "password": "${ password }"}`);
    return { port, password };
  } catch(err) {
    return Promise.reject('error');
  }
};

const listAccount = async () => {
  try {
    const accounts = await knex('account').select([ 'port', 'password' ]);
    return accounts;
  } catch(err) {
    return Promise.reject('error');
  }
};

const getFlow = async (options) => {
  try {
    const startTime = moment(options.startTime || new Date(0)).toDate().getTime();
    const endTime = moment(options.endTime || new Date()).toDate().getTime();

    const accounts = await knex('account').select([ 'port' ]);
    const flows = await knex('flow').select([ 'port' ])
    .sum('flow as sumFlow').groupBy('port')
    .whereBetween('time', [ startTime, endTime ]);
    accounts.map(m => {
      const flow = flows.filter(f => {
        return f.port === m.port;
      })[0];
      if(flow) {
        m.sumFlow = flow.sumFlow;
      } else {
        m.sumFlow = 0;
      }
      return m;
    });
    if(options.clear) {
      await knex('flow').whereBetween('time', [ startTime, endTime ]).delete();
    }
    return accounts;
  } catch(err) {
    logger.error(err);
    return Promise.reject('error');
  }
};

exports.addAccount = addAccount;
exports.removeAccount = removeAccount;
exports.changePassword = changePassword;
exports.listAccount = listAccount;
exports.getFlow = getFlow;
