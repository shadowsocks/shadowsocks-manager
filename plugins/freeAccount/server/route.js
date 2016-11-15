'use strict';

const app = appRequire('plugins/freeAccount/index').app;
const user = appRequire('plugins/freeAccount/server/user');
const manager = appRequire('plugins/freeAccount/server/manager');

app.post('/email', user.sendEmail);
app.post('/code', user.checkCode);
app.post('/account', user.getAccount);

app.post('/password', manager.checkPassword);
app.post('/logout', manager.logout);
app.post('/config', manager.isManager, manager.getConfig);
app.put('/config',  manager.isManager, manager.setConfig);
app.post('/user', manager.isManager, manager.user);
app.post('/flow', manager.isManager, manager.flow);

app.get('*', user.render);
