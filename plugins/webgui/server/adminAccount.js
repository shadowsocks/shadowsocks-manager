const macAccount = appRequire('plugins/macAccount/index');
const account = appRequire('plugins/account/index');
const dns = require('dns');
const net = require('net');
const knex = appRequire('init/knex').knex;
const flowPlugin = appRequire('plugins/flowSaver/flow');
const moment = require('moment');

const formatMacAddress = mac => mac.replace(/-/g, '').replace(/:/g, '').toLowerCase();

exports.getMacAccount = (req, res) => {
  const userId = +req.query.userId;
  macAccount.getAccount(userId, -1).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.addMacAccount = (req, res) => {
  const mac = formatMacAddress(req.params.macAddress);
  const userId = req.body.userId;
  const accountId = req.body.accountId;
  const serverId = req.body.serverId;
  macAccount.newAccount(mac, userId, serverId, accountId).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.editMacAccount = (req, res) => {
  const id = req.body.id;
  const mac = formatMacAddress(req.body.macAddress);
  const userId = req.body.userId;
  const accountId = req.body.accountId;
  const serverId = req.body.serverId;
  macAccount.editAccount(id, mac, serverId, accountId).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.deleteMacAccount = (req, res) => {
  const accountId = +req.query.id;
  macAccount.deleteAccount(accountId).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getMacAccountForUser = (req, res) => {
  const mac = req.params.macAddress;
  const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
  const noPassword = !!(+req.query.noPassword);
  const noFlow = !!(+req.query.noFlow);
  const type = req.query.type || 'Shadowsocks';
  macAccount.getAccountForUser(mac.toLowerCase(), ip, {
    type,
    noPassword,
    noFlow,
  }).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getNoticeForUser = (req, res) => {
  const mac = req.params.macAddress;
  const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
  macAccount
  .getNoticeForUser(mac.toLowerCase(), ip)
  .then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.banAccount = (req, res) => {
  const serverId = +req.params.serverId;
  const accountId = +req.params.accountId;
  const time = +req.body.time;
  account.banAccount({
    serverId,
    accountId,
    time,
  }).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.getBanAccount = (req, res) => {
  const serverId = +req.params.serverId;
  const accountId = +req.params.accountId;
  account.getBanAccount({
    serverId,
    accountId,
  }).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

const isMacAddress = str => {
  return str.match(/^([A-Fa-f0-9]{2}[:-]?){5}[A-Fa-f0-9]{2}$/);
};

const getAddress = (address, ip) => {
  let myAddress = address;
  if(address.indexOf(':') >= 0) {
    const hosts = address.split(':');
    const number = Math.ceil(Math.random() * (hosts.length - 1));
    myAddress = hosts[number];
  }
  if(!ip) {
    return Promise.resolve(myAddress);
  }
  if(net.isIP(myAddress)) {
    return Promise.resolve(myAddress);
  }
  return new Promise((resolve, reject) => {
    dns.lookup(myAddress, (err, ip, family) => {
      if(err) {
        return resolve(myAddress);
      }
      return resolve(ip);
    });
  });
};

const urlsafeBase64 = str => {
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

exports.getSubscribeAccountForUser = async (req, res) => {
  try {
    const ssr = req.query.ssr;
    let type = req.query.type || 'shadowrocket';
    if(ssr === '1') { type = 'ssr'; }
    const resolveIp = !!req.query.ip;
    const showFlow = !!req.query.flow;
    const token = req.params.token;
    const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
    let subscribeAccount = {};
    let trojanServers = [];
    if(isMacAddress(token)) {
      subscribeAccount = await macAccount.getMacAccountForSubscribe(token, ip);
    } else {
      const isSubscribeOn = await knex('webguiSetting').where({
        key: 'account'
      }).then(s => s[0]).then(s => JSON.parse(s.value).subscribe);
      if(!isSubscribeOn) { return res.status(404).end(); }
      const accounts = await account.getAccountForSubscribe(token, ip);
      subscribeAccount = {
        ...accounts,
        server: accounts.server.filter(server => server.type === 'Shadowsocks'),
      };
      trojanServers = accounts.server.filter(server => server.type === 'Trojan');
    }
    for(const s of subscribeAccount.server) {
      s.host = await getAddress(s.host, resolveIp);
    }
    for(const s of trojanServers) {
      if (s.host.split(':').length !== 1) {
        const hosts = s.host.split(':');
        const number = Math.ceil(Math.random() * (hosts.length - 1));
        s.host = hosts[number];
      }
    }
    const baseSetting = await knex('webguiSetting').where({
      key: 'base'
    }).then(s => s[0]).then(s => JSON.parse(s.value));
    const ssdInfo = {
      airport: 'ssmgr',
      port: subscribeAccount.account.port,
      encryption: 'aes-256-gcm',
      password: subscribeAccount.account.password,
      servers: subscribeAccount.server.filter(s => !s.subscribeName).map(s => {
        return {
          id: s.id,
          server: s.host,
          port: subscribeAccount.account.port + s.shift,
          encryption: s.method,
          remarks: s.name,
        };
      }),
    };
    if(subscribeAccount.account.type !== 1 && showFlow) {
      const template = {
        subscribeName: '',
        name: '',
        host: 'localhost',
        method: 'chacha20-ietf-poly1305',
        shift: 0,
        id: 0,
      };
      const time = {
        '2': 7 * 24 * 3600000,
        '3': 30 * 24 * 3600000,
        '4': 24 * 3600000,
        '5': 3600000,
      };
      const expire = subscribeAccount.account.data.create + subscribeAccount.account.data.limit * time[subscribeAccount.account.type];
      ssdInfo.expiry = moment(expire).format('YYYY-MM-DD HH:mm:ss');

      const remain = expire - Date.now();
      const insert = { 
        ...template,
        subscribeName: remain <= 0
                      ? '已过期'
                      : remain >= 48 * 3600 * 1000
                      ? moment(expire).format('YYYY-MM-DD过期')
                      : remain >= 3600 * 1000
                      ? `${Math.floor(remain / (3600 * 1000))}小时后过期`
                      : `${Math.floor(remain / (60 * 1000))}分钟后过期`,
      };

      const insertFlow = { ...template };
      if(subscribeAccount.account.multiServerFlow) {
        const flow = subscribeAccount.account.data.flow;
        const time = {
          '2': 7 * 24 * 3600000,
          '3': 30 * 24 * 3600000,
          '4': 24 * 3600000,
          '5': 3600000,
        };
        let from = subscribeAccount.account.data.create;
        let to = subscribeAccount.account.data.create + time[subscribeAccount.account.type];
        while(to <= Date.now()) {
          from = to;
          to = from + time[subscribeAccount.account.type];
        }
        const [ currentFlow ] = await flowPlugin.getServerPortFlowWithScale(0, subscribeAccount.account.id, [from, to], true);
        ssdInfo.traffic_used = currentFlow / (1000 * 1000 * 1000);
        ssdInfo.traffic_total = flow / (1000 * 1000 * 1000);
        const toFlowString = input => {
          const K = 1000;
          const M = 1000 * 1000;
          const G = 1000 * 1000 * 1000;
          const T = 1000 * 1000 * 1000 * 1000;
          const P = 1000 * 1000 * 1000 * 1000 * 1000;
          if (input < K) {
            return input + 'B';
          } else if (input < M) {
            return (input / K).toFixed(1) + 'KB';
          } else if (input < G) {
            return (input / M).toFixed(1) + 'MB';
          } else if (input < T) {
            return (input / G).toFixed(2) + 'GB';
          } else if (input < P) {
            return (input / T).toFixed(3) + 'TB';
          } else {
            return input;
          }
        };
        insertFlow.subscribeName = `${toFlowString(currentFlow)}/${toFlowString(flow)}`;
      }
      subscribeAccount.server = [
        ...(insertFlow.subscribeName ? [insertFlow] : []),
        insert,
        ...subscribeAccount.server,
      ];
    }
    if(type === 'ssd') {
      return res.send('ssd://' + Buffer.from(JSON.stringify(ssdInfo)).toString('base64'));
    }
    if(type === 'clash') {
      const yaml = require('js-yaml');
      const clashConfig = appRequire('plugins/webgui/server/clash');
      const proxyNames = [
        ...subscribeAccount.server.map(server => server.subscribeName || server.name),
        ...trojanServers.map(server => server.subscribeName || server.name),
      ];
      const generatedConfig = {
        ...clashConfig,
        proxies: [
          ...subscribeAccount.server.map(server => ({
            cipher: server.method,
            name: server.subscribeName || server.name,
            password: String(subscribeAccount.account.password),
            port: subscribeAccount.account.port + server.shift,
            server: server.host,
            type: 'ss'
          })),
          ...trojanServers.map(server => ({
            name: server.subscribeName || server.name,
            type: 'trojan',
            server: server.host,
            port: server.tjPort,
            password: `${subscribeAccount.account.port}:${subscribeAccount.account.password}`,
          }))
        ],
        'proxy-groups': clashConfig['proxy-groups'].map(group => {
          if (!group.proxies.includes('placeholder')) {
            return group;
          } else {
            let proxies = group.proxies.slice();
            proxies.splice(group.proxies.indexOf('placeholder'), 1, ...proxyNames);
            return {
              ...group,
              proxies
            };
          }
        })
      };
      return res.send(yaml.safeDump(generatedConfig));
    }
    if(type === 'mellow') {
      const template = [
        '[Endpoint]',
        '@{SERVERS}',
        'Direct, builtin, freedom, domainStrategy=UseIP',
        'Dns-Out, builtin, dns',
        '[EndpointGroup]',
        '@{GROUP}',
        '[RoutingRule]',
        'DOMAIN-KEYWORD, geosite:cn, Direct',
        'GEOIP, cn, Direct',
        'GEOIP, private, Direct',
        'FINAL, allServers',
        '[Dns]',
        'hijack = Dns-Out',
        '[DnsServer]',
        'localhost',
        '8.8.8.8',
      ].join('\n')
      .replace('@{SERVERS}', subscribeAccount.server.map(s => {
        return `${s.subscribeName || s.name}, ss, ss://${s.method}:${subscribeAccount.account.password}@${s.host}:${(subscribeAccount.account.port +  + s.shift)}\n`;
      }).join(''))
      .replace('@{GROUP}', 'allServers, ' + subscribeAccount.server.map(s => {
        return `${s.subscribeName || s.name}`;
      }).join(':') + ', latency, interval=300, timeout=6');
      return res.send(template);
    }
    if(type === 'android') {
      const servers = subscribeAccount.server.map(s => {
        return {
          id: s.id,
          remarks: s.name,
          server: s.host,
          server_port: subscribeAccount.account.port + s.shift,
          password: subscribeAccount.account.password,
          method: s.method,
        };
      });
      return res.json({
        version: 1,
        remarks: 'ssmgr',
        servers,
      });
    }
    if(type === 'shadowrocket') {
      const ssServers = subscribeAccount.server.map(s => {
        const base64string = `${s.method}:${subscribeAccount.account.password}@${s.host}:${subscribeAccount.account.port + s.shift}`;
        return `ss://${Buffer.from(base64string).toString('base64')}#${encodeURIComponent(s.subscribeName || s.name)}`;
      });
      const tjServers = trojanServers.map(s => 
        `trojan://${encodeURIComponent(`${subscribeAccount.account.port}:${subscribeAccount.account.password}`)}@${s.host}:${s.tjPort}#${encodeURIComponent(s.subscribeName || s.name)}`
      );
      return res.send(Buffer.from([...ssServers, ...tjServers].join('\r\n')).toString('base64'));
    }
    const result = subscribeAccount.server.map(s => {
      if(type === 'potatso') {
        return 'ss://' + Buffer.from(s.method + ':' + subscribeAccount.account.password + '@' + s.host + ':' + (subscribeAccount.account.port + s.shift)).toString('base64') + '#' + (s.subscribeName || s.name);
      } else if(type === 'ssr') {
        return 'ssr://' + urlsafeBase64(s.host + ':' + (subscribeAccount.account.port + s.shift) + ':origin:' + s.method + ':plain:' + urlsafeBase64(subscribeAccount.account.password) +  '/?obfsparam=&remarks=' + urlsafeBase64(s.subscribeName || s.name) + '&group=' + urlsafeBase64(baseSetting.title));
      }
    }).join('\r\n');
    return res.send(Buffer.from(result).toString('base64'));
  } catch (err) {
    console.log(err);
    res.status(403).end();
  }
};
