const log4js = require('log4js');
const logger = log4js.getLogger('webgui');
const crypto = require('crypto');

const config = appRequire('services/config').all();

const user = appRequire('plugins/user/index');
const account = appRequire('plugins/account/index');
const affiliates = appRequire('plugins/affiliates/index');
const flow = appRequire('plugins/flowSaver/flow');
const knex = appRequire('init/knex').knex;
const emailPlugin = appRequire('plugins/email/index');
const push = appRequire('plugins/webgui/server/push');
const macAccount = appRequire('plugins/macAccount/index');

const isTelegram = config.plugins.webgui_telegram && config.plugins.webgui_telegram.use;
let telegram;
if(isTelegram) {
  telegram = appRequire('plugins/webgui_telegram/admin');
}

const formatMacAddress = mac => {
  return mac.replace(/-/g, '').replace(/:/g, '').toLowerCase();
};

exports.signup = (req, res) => {
  let referrerIp = '';
  let referrerUserId = NaN;
  let registeringUserId = NaN;
  const userIp = req.headers['x-real-ip'] || 
    (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',').pop()) || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress || 
    req.connection.socket.remoteAddress;

  req.checkBody('email', 'Invalid email').isEmail();
  req.checkBody('code', 'Invalid code').notEmpty();
  req.checkBody('password', 'Invalid password').notEmpty();
  let type = 'normal';
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const email = req.body.email.toString().toLowerCase();
      const code = req.body.code;
      return emailPlugin.checkCode(email, code);
    }
    return Promise.reject('invalid body');
  }).then(() => {
    //Check the IP address.
    return affiliates.checkRegisteringIpAddress(userIp);
  }).then(success => {
    const ipIsUsed = success[0].count;
    if (ipIsUsed){
      return Promise.reject('fraud register: ip used');
    }
    return;
  }).then(success => {
    //Check the IP in afftoken.
    const afftoken = req.cookies && req.cookies['afftoken'];
    if (!afftoken){
      return;//No afftoken in cookie, skip checking.
    }
    const tokenPassword = config.plugins.affiliates.tokenPassword;
    const decrypt = (text, password) => {
      try {
        var decipher = crypto.createDecipher('aes-256-ctr', password);
        var dec = decipher.update(text,'hex','utf8');
        dec += decipher.final('utf8');
        return dec;
      } catch (e){
        return '';
      }
    }
    const afftokenRaw = decrypt(afftoken, tokenPassword);
    if (!afftokenRaw || afftokenRaw.split(':').length != 2){
      return Promise.reject('fraud register: token broken');
    }
    referrerIp = afftokenRaw.split(':')[0];
    referrerUserId = parseInt(afftokenRaw.split(':')[1]);
    
    if (referrerIp == userIp){
      return Promise.reject('fraud register: referring self');
    }
    return;
  }).then(success => {
    // The first user will be admin
    return knex('user').count('id AS count').then(success => {
      if(!success[0].count) {
        type = 'admin';
      }
      return;
    });
  }).then(success => {
    const email = req.body.email.toString().toLowerCase();
    const password = req.body.password;
    return user.add({
      username: email,
      email,
      password,
      type,
    });
  }).then(success => {
    req.session.user = success[0];
    req.session.type = type;
    if(success[0] > 1) {
      const userId = success[0];
      registeringUserId = userId;
      // let port = 50000;
      return knex('webguiSetting').select().where({
        key: 'account',
      })
      .then(success => JSON.parse(success[0].value))
      .then(success => {
        const newUserAccount = success.accountForNewUser;
        if(!success.accountForNewUser.isEnable) {
          return;
        }
        const getNewPort = () => {
          return knex('webguiSetting').select().where({
            key: 'account',
          }).then(success => {
            if(!success.length) { return Promise.reject('settings not found'); }
            success[0].value = JSON.parse(success[0].value);
            return success[0].value.port;
          }).then(port => {
            if(port.random) {
              const getRandomPort = () => Math.floor(Math.random() * (port.end - port.start + 1) + port.start);
              let retry = 0;
              let myPort = getRandomPort();
              const checkIfPortExists = port => {
                let myPort = port;
                return knex('account_plugin').select()
                .where({ port }).then(success => {
                  if(success.length && retry <= 30) {
                    retry++;
                    myPort = getRandomPort();
                    return checkIfPortExists(myPort);
                  } else if (success.length && retry > 30) {
                    return Promise.reject('Can not get a random port');
                  } else {
                    return myPort;
                  }
                });
              };
              return checkIfPortExists(myPort);
            } else {
              return knex('account_plugin').select()
              .whereBetween('port', [port.start, port.end])
              .orderBy('port', 'DESC').limit(1).then(success => {
                if(success.length) {
                  return success[0].port + 1;
                }
                return port.start;
              });
            }
          });
        };
        return getNewPort().then(port => {
          return account.addAccount(newUserAccount.type || 5, {
            user: userId,
            port,
            password: Math.random().toString().substr(2,10),
            time: Date.now(),
            limit: newUserAccount.limit || 8,
            flow: (newUserAccount.flow ? newUserAccount.flow : 350) * 1000000,
            server: newUserAccount.server ? JSON.stringify(newUserAccount.server): null,
            autoRemove: newUserAccount.autoRemove ? 1 : 0,
          });
        });
      });
    } else {
      return;
    }
  }).then(success => { //Process the affiliates bonus.
    if (!config.plugins.affiliates || !config.plugins.affiliates.use){
      return;
    }
    if (!referrerIp || !referrerUserId || !registeringUserId || !userIp){
      return;
    }

    return knex('account_plugin').select().where({
        userId: referrerUserId,
    }).then(success => {
      if (success.length == 0) { //Referrer has no account currently, create one for him/her
        return knex('webguiSetting').select().where({
          key: 'account',
        })
        .then(success => {
          if(!success.length) { return Promise.reject('settings not found'); }
          return JSON.parse(success[0].value)
        })
        .then(success => {
          const newUserAccount = success.accountForNewUser;
          const getNewPort = () => {
            return knex('webguiSetting').select().where({
              key: 'account',
            })
            .then(success => {
              if(!success.length) { return Promise.reject('settings not found'); }
              success[0].value = JSON.parse(success[0].value);
              return success[0].value.port;
            })
            .then(port => {
              if(port.random) {
                const getRandomPort = () => Math.floor(Math.random() * (port.end - port.start + 1) + port.start);
                let retry = 0;
                let myPort = getRandomPort();
                const checkIfPortExists = port => {
                  let myPort = port;
                  return knex('account_plugin').select()
                  .where({ port }).then(success => {
                    if(success.length && retry <= 30) {
                      retry++;
                      myPort = getRandomPort();
                      return checkIfPortExists(myPort);
                    } else if (success.length && retry > 30) {
                      return Promise.reject('Can not get a random port');
                    } else {
                      return myPort;
                    }
                  });
                };
                return checkIfPortExists(myPort);
              } else {
                return knex('account_plugin').select()
                .whereBetween('port', [port.start, port.end])
                .orderBy('port', 'DESC').limit(1).then(success => {
                  if(success.length) {
                    return success[0].port + 1;
                  }
                  return port.start;
                });
              }
            });
          };
          return getNewPort().then(port => {
            return knex('webguiSetting').select().where({
              key: 'affiliates',
            })
            .then(success => {
              if(!success.length) { return Promise.reject('settings not found'); }
              return JSON.parse(success[0].value)
            })
            .then(success => {
              return {
                port: port,
                affiliatesSettings: success
              }
            });
          })
          .then(success => {
            return account.addAccount(4, {
              user: referrerUserId,
              port: success.port,
              password: Math.random().toString().substr(2,10),
              time: Date.now(),
              limit: (success.affiliatesSettings && success.affiliatesSettings.duration ? success.affiliatesSettings.duration : config.plugins.affiliates.duration),
              flow: (success.affiliatesSettings && success.affiliatesSettings.flow ? success.affiliatesSettings.flow : config.plugins.affiliates.flow) * 1000000,
              server: newUserAccount.server ? JSON.stringify(newUserAccount.server): null,
              autoRemove: newUserAccount.autoRemove ? 1 : 0,
            })
            .then(success => {
              return 'bonus_assigned'
            });
          });
        });
      }else{ //The referrer user has at least one account, add the bonus to this account.
        const currentAccount = success[0];
        if (currentAccount.type < 2 || currentAccount.type > 5){
          return;
        }
        const currentAccountData = JSON.parse(currentAccount.data);

        return knex('webguiSetting').select().where({
          key: 'affiliates',
        })
        .then(success => {
          if(!success.length) { return Promise.reject('settings not found'); }
          return JSON.parse(success[0].value)
        })
        .then(affiliatesSettings => {
          const durationDays = affiliatesSettings && affiliatesSettings.duration ? affiliatesSettings.duration : config.plugins.affiliates.duration;
          const addFlow = affiliatesSettings && affiliatesSettings.flow ? affiliatesSettings.flow : config.plugins.affiliates.flow;
          
          const addNumber = {
            '2': durationDays/7.0,
            '3': durationDays/30.0,
            '4': durationDays,
            '5': durationDays*24,
          }[currentAccount.type];
          
          const timePeriod = {
            '2': 7 * 86400 * 1000,
            '3': 30 * 86400 * 1000,
            '4': 1 * 86400 * 1000,
            '5': 3600 * 1000,
          };

          let newCreate = currentAccountData.create;
          let newLimit = +currentAccountData.limit + addNumber;

          if(currentAccountData.create + currentAccountData.limit * timePeriod[currentAccount.type] <= Date.now()) {
            newCreate = Date.now();
            newLimit = addNumber;
          }

          return account.editAccount(currentAccount.id, {
            type: currentAccount.type,
            port: currentAccount.port,
            password: currentAccount.password,
            time: newCreate,
            limit: newLimit,
            flow: currentAccountData.flow + addFlow * 1000000,
            autoRemove: currentAccount.autoRemove,
            server: currentAccount.server,
          }).then(success=>{
            return 'bonus_assigned';
          });
        });
      }
    });
  })
  .then(success => { //Write the records to affiliates table.
    if (!config.plugins.affiliates || !config.plugins.affiliates.use){
      return;
    }

    if (success == 'bonus_assigned'){
      return knex('webguiSetting').select().where({
        key: 'affiliates',
      })
      .then(success => {
        if(!success.length) { return Promise.reject('settings not found'); }
        return JSON.parse(success[0].value)
      })
      .then(affiliatesSettings => {
        const durationDays = affiliatesSettings && affiliatesSettings.duration ? affiliatesSettings.duration : config.plugins.affiliates.duration;
        const addFlow = affiliatesSettings && affiliatesSettings.flow ? affiliatesSettings.flow : config.plugins.affiliates.flow;
        return affiliates.addAffiliates(
          userIp,
          registeringUserId,
          Date.now(),
          referrerUserId,
          addFlow * 1000000,
          durationDays
        );
      });
    } else if (registeringUserId && userIp){ 
      //If bonus is not assigned, but register is successful, only record the userIp.
      //This prevent fraud register from a same IP.
      return affiliates.addAffiliates(
        userIp,
        registeringUserId,
        Date.now(),
        null,
        0,
        0
      );
    } else{
      return;
    }
  })
  .then(success => {
    logger.info(`[${ req.body.email }] signup success`);
    push.pushMessage('注册', {
      body: `用户[ ${ req.body.email.toString().toLowerCase() } ]注册成功`,
    });
    isTelegram && telegram.push(`用户[ ${ req.body.email.toString().toLowerCase() } ]注册成功`);
    res.send(type);
  }).catch(err => {
    logger.error(`[${ req.body.email }] signup fail: ${ err }`);
    res.status(403).end();
  });
};

exports.login = (req, res) => {
  delete req.session.user;
  delete req.session.type;
  req.checkBody('email', 'Invalid email').isEmail();
  req.checkBody('password', 'Invalid password').notEmpty();
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const email = req.body.email.toString().toLowerCase();
      const password = req.body.password;
      return user.checkPassword(email, password);
    }
    return Promise.reject('invalid body');
  }).then(success => {
    logger.info(`[${ req.body.email }] login success`);
    req.session.user = success.id;
    req.session.type = success.type;
    res.send({ type: success.type });
  }).catch(err => {
    logger.error(`User[${ req.body.email }] login fail: ${ err }`);
    const errorData = ['invalid body', 'user not exists', 'invalid password', 'password retry out of limit'];
    if(errorData.indexOf(err) < 0) {
      return res.status(500).end();
    } else {
      return res.status(403).end(err);
    }
  });
};

exports.macLogin = (req, res) => {
  delete req.session.user;
  delete req.session.type;
  const mac = formatMacAddress(req.body.mac);
  const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
  macAccount.login(mac, ip)
  .then(success => {
    req.session.user = success.userId;
    req.session.type = 'normal';
    return res.send('success');
  }).catch(err => {
    return res.status(403).end();
  });
};

exports.logout = (req, res) => {
  delete req.session.user;
  delete req.session.type;
  res.send('success');
};

exports.status = (req, res) => {
  res.send({ status: req.session.type });
};

exports.sendCode = (req, res) => {
  let referrerIp = '';
  let referrerUserId = NaN;
  const userIp = req.headers['x-real-ip'] || 
    (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',').pop()) || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress || 
    req.connection.socket.remoteAddress;
  req.checkBody('email', 'Invalid email').isEmail();
  req.getValidationResult().then(result => {
    if(result.isEmpty) { return; }
    return Promise.reject('invalid email');
  }).then(() => {
    //Check the IP address.
    return affiliates.checkRegisteringIpAddress(userIp);
  }).then(success => {
    const ipIsUsed = success[0].count;
    if (ipIsUsed){
      return Promise.reject('fraud register: ip used');
    }
    return;
  }).then(success => {
    //Check the IP in afftoken.
    const afftoken = req.cookies && req.cookies['afftoken'];
    if (!afftoken){
      return;//No afftoken in cookie, skip checking.
    }
    const tokenPassword = config.plugins.affiliates.tokenPassword;
    const decrypt = (text, password) => {
      try {
        var decipher = crypto.createDecipher('aes-256-ctr', password);
        var dec = decipher.update(text,'hex','utf8');
        dec += decipher.final('utf8');
        return dec;
      } catch (e){
        return '';
      }
    }
    const afftokenRaw = decrypt(afftoken, tokenPassword);
    if (!afftokenRaw || afftokenRaw.split(':').length != 2){
      return Promise.reject('fraud register: token broken');
    }
    referrerIp = afftokenRaw.split(':')[0];
    referrerUserId = parseInt(afftokenRaw.split(':')[1]);
    
    if (referrerIp == userIp){
      return Promise.reject('fraud register: referring self');
    }
    return;
  }).then(() => {
    return knex('webguiSetting').select().where({
      key: 'account',
    })
    .then(success => JSON.parse(success[0].value))
    .then(success => {
      if(success.signUp.isEnable) { return; }
      return Promise.reject('signup close');
    });
  }).then(() => {
    return knex('webguiSetting').select().where({
      key: 'mail',
    }).then(success => {
      if(!success.length) {
        return Promise.reject('settings not found');
      }
      success[0].value = JSON.parse(success[0].value);
      return success[0].value.code;
    });
  }).then(success =>{
    const email = req.body.email.toString().toLowerCase();
    const ip = userIp;
    const session = req.sessionID;
    return emailPlugin.sendCode(email, success.title || 'ss验证码', success.content || '欢迎新用户注册，\n您的验证码是：', {
      ip,
      session,
    });
  }).then(success => {
    res.send('success');
  }).catch(err => {
    logger.error(err);
    const errorData = ['email in black list', 'send email out of limit', 'signup close', 'fraud register: ip used', 'fraud register: token broken', 'fraud register: referring self'];
    if(errorData.indexOf(err) < 0) {
      return res.status(403).end();
    } else {
      return res.status(403).end(err);
    }
  });
};

exports.sendResetPasswordEmail = (req, res) => {
  const crypto = require('crypto');
  const email = req.body.email.toString().toLowerCase();
  let token = null;
  let resetEmail;
  knex('webguiSetting').select().where({
    key: 'mail',
  }).then(success => {
    if(!success.length) {
      return Promise.reject('settings not found');
    }
    success[0].value = JSON.parse(success[0].value);
    return success[0].value.reset;
  }).then(success => {
    resetEmail = success;
    return knex('user').select().where({
      username: email,
    }).then(users => {
      if(!users.length) {
        return Promise.reject('user not exists');
      }
      return users[0];
    });
  }).then(user => {
    if(user.resetPasswordTime + 600 * 1000 >= Date.now()) {
      return Promise.reject('already send');
    }
    token = crypto.randomBytes(16).toString('hex');
    const ip = req.headers['x-real-ip'] || req.connection.remoteAddress;
    const session = req.sessionID;
    const address = config.plugins.webgui.site + '/home/password/reset/' + token;
    if(resetEmail.content.indexOf('${address}') >= 0) {
      resetEmail.content = resetEmail.content.replace(/\$\{address\}/g, address);
    } else {
      resetEmail.content += '\n' + address;
    }
    return emailPlugin.sendMail(email, resetEmail.title, resetEmail.content, {
      ip,
      session,
      type: 'reset',
    });
  }).then(success => {
    return user.edit({
      username: email,
    }, {
      resetPasswordId: token,
      resetPasswordTime: Date.now(),
    });
  }).then(success => {
    res.send('success');
  }).catch(err => {
    logger.error(err);
    const errorData = ['already send', 'user not exists'];
    if(errorData.indexOf(err) < 0) {
      return res.status(403).end();
    } else {
      return res.status(403).end(err);
    }
  });
};

exports.checkResetPasswordToken = (req, res) => {
  const token = req.query.token;
  knex('user').select().where({
    resetPasswordId: token,
  }).whereBetween('resetPasswordTime', [ Date.now() - 600 * 1000, Date.now() ])
  .then(users => {
    if(!users.length) {
      return Promise.reject('user not exists');
    }
    return users[0];
  }).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.resetPassword = (req, res) => {
  req.checkBody('token', 'Invalid token').notEmpty();
  req.checkBody('password', 'Invalid password').notEmpty();
  req.getValidationResult().then(result => {
    if(result.isEmpty) { return; }
    return Promise.reject('invalid body');
  }).then(() => {
    const token = req.body.token;
    const password = req.body.password;
    return user.edit({
      resetPasswordId: token,
    }, {
      password,
      resetPasswordId: null,
      resetPasswordTime: null,
    });
  }).then(success => {
    res.send('success');
  }).catch(err => {
    logger.error(err);
    res.status(403).end();
  });
};
