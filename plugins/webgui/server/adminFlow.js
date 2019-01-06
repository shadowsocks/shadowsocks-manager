const flow = appRequire('plugins/flowSaver/flow');
const moment = require('moment');
const knex = appRequire('init/knex').knex;

exports.getServerFlow = (req, res) => {
  const serverId = req.params.serverId;
  const accountId = req.query.accountId;
  const type = req.query.type;
  const time = req.query.time || Date.now();
  let timeArray = [];
  if(Array.isArray(time)) {
    timeArray = time.map(m => +m);
  } else if(type === 'day') {
    let i = 0;
    while(i < 25) {
      timeArray.push(moment(+time).hour(i).minute(0).second(0).millisecond(0).toDate().valueOf());
      i++;
    }
  } else if (type === 'hour') {
    let i = 0;
    while(i < 13) {
      timeArray.push(moment(+time).minute(i * 5).second(0).millisecond(0).toDate().valueOf());
      i++;
    }
  } else if (type === 'week') {
    let i = 0;
    while(i < 8) {
      timeArray.push(moment(+time).day(i).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf());
      i++;
    }
  }
  let getFlow;
  if(accountId) {
    getFlow = flow.getServerPortFlow(serverId, +accountId, timeArray);
  } else {
    getFlow = flow.getServerFlow(serverId, timeArray);
  }
  getFlow.then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getServerLastHourFlow = (req, res) => {
  const serverId = req.params.serverId;
  let timeArray = [];
  let i = 0;
  const now = Date.now();
  const time = moment(now).add(0 - (moment(now).minute() % 5), 'm').second(0).millisecond(0).toDate().valueOf();
  while(i < 13) {
    timeArray.push(moment(time).add(i * 5 - 60, 'm').toDate().valueOf());
    i++;
  }
  const timeRet = timeArray.map((time, index) => {
    return moment(time).minute();
  }).slice(0, 12);
  flow.getServerFlow(serverId, timeArray).then(success => {
    res.send({
      time: timeRet,
      flow: success,
    });
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getServerUserFlow = (req, res) => {
  const serverId = +req.params.serverId;
  const type = req.query.type;
  const time = +req.query.time || Date.now();
  let timeArray = [];
  if(Array.isArray(time)) {
    timeArray = time;
  } else if(type === 'day') {
    timeArray.push(moment(time).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf());
    timeArray.push(moment(time).hour(24).minute(0).second(0).millisecond(0).toDate().valueOf());
  } else if (type === 'hour') {
    timeArray.push(moment(time).minute(0).second(0).millisecond(0).toDate().valueOf());
    timeArray.push(moment(time).minute(60).second(0).millisecond(0).toDate().valueOf());
  } else if (type === 'week') {
    timeArray.push(moment(time).day(0).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf());
    timeArray.push(moment(time).day(7).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf());
  }
  flow.getServerUserFlow(serverId, timeArray).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getServerPortFlow = (req, res) => {
  const serverId = +req.params.serverId;
  const accountId = +req.params.accountId;
  let account = null;
  knex('account_plugin').select().where({
    id: accountId,
  }).then(success => {
    if(!success.length) {
      return Promise.reject('account not found');
    }
    account = success[0];
    account.data = JSON.parse(account.data);
    const time = {
      '2': 7 * 24 * 3600000,
      '3': 30 * 24 * 3600000,
      '4': 24 * 3600000,
      '5': 3600000,
    };
    if(account.type >=2 && account.type <= 5) {
      const timeArray = [account.data.create, account.data.create + time[account.type]];
      if(account.data.create <= Date.now()) {
        let i = 0;
        while(account.data.create + i * time[account.type] <= Date.now()) {
          timeArray[0] = account.data.create + i * time[account.type];
          timeArray[1] = account.data.create + (i + 1) * time[account.type];
          i++;
        }
      }
      return flow.getServerPortFlowWithScale(serverId, accountId, timeArray, account.multiServerFlow);
    } else {
      return [ 0 ];
    }
  }).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getAccountServerFlow = (req, res) => {
  const accountId = +req.params.accountId;
  const type = req.query.type;
  const time = +req.query.time || Date.now();
  let timeArray = [];
  if(Array.isArray(time)) {
    timeArray = time;
  } else if(type === 'day') {
    timeArray.push(moment(time).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf());
    timeArray.push(moment(time).hour(24).minute(0).second(0).millisecond(0).toDate().valueOf());
  } else if (type === 'hour') {
    timeArray.push(moment(time).minute(0).second(0).millisecond(0).toDate().valueOf());
    timeArray.push(moment(time).minute(60).second(0).millisecond(0).toDate().valueOf());
  } else if (type === 'week') {
    timeArray.push(moment(time).day(0).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf());
    timeArray.push(moment(time).day(7).hour(0).minute(0).second(0).millisecond(0).toDate().valueOf());
  }
  flow.getAccountServerFlow(accountId, timeArray).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getServerPortLastConnect = (req, res) => {
  const serverId = +req.params.serverId;
  const accountId = +req.params.accountId;
  flow.getlastConnectTime(serverId, accountId)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getTopFlow = (req, res) => {
  const group = req.adminInfo.id === 1 ? -1 : req.adminInfo.group;
  flow.getTopFlow(group)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};
