'use strict';

const dgram = require('dgram');
const client = dgram.createSocket('udp4');

const config = appRequire('services/config').all();
const host = config.shadowsocks.address.split(':')[0];
const port = +config.shadowsocks.address.split(':')[1];

const knex = appRequire('init/knex').knex;

const moment = require('moment');
let lastFlow;

const sendPing = () => {
  client.send(new Buffer('ping'), port, host);
};

const sendMessage = (message) => {
  console.log('Send to shadowsocks: ' + message);
  return new Promise((res, rej) => {
    const client = dgram.createSocket('udp4');
    client.send(message, port, host, (err) => {
      if(err) {
        return rej('error');
      }
    });
    client.on('message', (msg) => {
      client.close();
      res('ok');
    });
    client.on('close', () => {
      return rej('close');
    });
  });
};

const startUp = async () => {
  client.send(new Buffer('ping'), port, host);
  const accounts = await knex('account').select([ 'port', 'password' ]);
  accounts.forEach(f => {
    sendMessage(`add: {"server_port": ${ f.port }, "password": "${ f.password }"}`);
  });
};

const compareWithLastFlow = (flow, lastFlow) => {
  const realFlow = {};
  if(!lastFlow) {
    return flow;
  }
  for(const f in flow) {
    if(lastFlow[f] !== flow[f]) {
      realFlow[f] = flow[f];
    }
  }
  return realFlow;
};

client.on('message', async (msg, rinfo) => {
  const msgStr = new String(msg);
  if(msgStr.substr(0, 5) === 'stat:') {
    let flow = JSON.parse(msgStr.substr(5));
    const realFlow = compareWithLastFlow(flow, lastFlow);
    console.log('realFlow');
    console.log(flow);
    console.log(realFlow);
    console.log();
    lastFlow = flow;
    const insertFlow = Object.keys(realFlow).map(m => {
      return {
        port: +m,
        flow: +flow[m],
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
    // console.log(insertFlow);
    if(insertFlow.length > 0) {
      knex('flow').insert(insertFlow).then();
    }
  };
});

client.on('error', (err) => {
  console.log(`client error:\n${err.stack}`);
});

startUp();
// sendPing();
setInterval(() => {
  sendPing();
}, 60 * 1000);

const addAccount = async (port, password) => {
  try {
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
    const startTime = moment(options.startTime || new Date(0)).toDate();
    const endTime = moment(options.endTime || new Date()).toDate();

    const accounts = await knex('account').select([ 'port' ]);
    const flows = await knex('flow').select([ 'port', 'sumFlow' ])
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
    console.log('accounts');
    console.log(accounts);
    console.log();
    return accounts;
  } catch(err) {
    console.log(err);
    return Promise.reject('error');
  }
};

exports.addAccount = addAccount;
exports.removeAccount = removeAccount;
exports.changePassword = changePassword;
exports.listAccount = listAccount;
exports.getFlow = getFlow;
