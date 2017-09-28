const manager = appRequire('services/manager');
const serverManager = appRequire('plugins/flowSaver/server');
const knex = appRequire('init/knex').knex;

exports.getServers = (req, res) => {
  serverManager.list({
    status: !!req.query.status,
  }).then(success => {
    res.send(success);
  }).catch(err => {
    console.log(err);
    res.status(500).end();
  });
};

exports.getOneServer = (req, res) => {
  const serverId = req.params.serverId;
  const noPort = req.query.noPort;
  let result = null;
  knex('server').select().where({
    id: +serverId,
  }).then(success => {
    if(success.length) {
      result = success[0];
      if(noPort) { return; }
      return manager.send({
        command: 'list',
      }, {
        host: success[0].host,
        port: success[0].port,
        password: success[0].password,
      });
    }
    res.status(404).end();
  }).then(success => {
    if(success) { result.ports = success; }
    res.send(result);
  }).catch(err => {
    console.log(err);
    res.status(500).end();
  });
};

exports.addServer = (req, res) => {
  req.checkBody('name', 'Invalid name').notEmpty();
  req.checkBody('address', 'Invalid address').notEmpty();
  req.checkBody('port', 'Invalid port').isInt({min: 1, max: 65535});
  req.checkBody('password', 'Invalid password').notEmpty();
  req.checkBody('method', 'Invalid method').notEmpty();
  req.checkBody('scale', 'Invalid scale').notEmpty();
  req.checkBody('shift', 'Invalid shift').isInt();
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const address = req.body.address;
      const port = +req.body.port;
      const password = req.body.password;
      return manager.send({
        command: 'flow',
        options: { clear: false, },
      }, {
        host: address,
        port,
        password,
      });
    }
    result.throw();
  }).then(success => {
    const name = req.body.name;
    const comment = req.body.comment;
    const address = req.body.address;
    const port = +req.body.port;
    const password = req.body.password;
    const method = req.body.method;
    const scale = req.body.scale;
    const shift = req.body.shift;
    // return serverManager.add(name, address, port, password, method, scale, comment, shift);
    return serverManager.add({
      name,
      host: address,
      port,
      password,
      method,
      scale,
      comment,
      shift,
    });
  }).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.editServer = (req, res) => {
  req.checkBody('name', 'Invalid name').notEmpty();
  req.checkBody('address', 'Invalid address').notEmpty();
  req.checkBody('port', 'Invalid port').isInt({min: 1, max: 65535});
  req.checkBody('password', 'Invalid password').notEmpty();
  req.checkBody('method', 'Invalid method').notEmpty();
  req.checkBody('scale', 'Invalid scale').notEmpty();
  req.checkBody('shift', 'Invalid shift').isInt();
  req.getValidationResult().then(result => {
    if(result.isEmpty()) {
      const address = req.body.address;
      const port = +req.body.port;
      const password = req.body.password;
      return manager.send({
        command: 'flow',
        options: { clear: false, },
      }, {
        host: address,
        port,
        password,
      });
    }
    result.throw();
  }).then(success => {
    const serverId = req.params.serverId;
    const name = req.body.name;
    const comment = req.body.comment;
    const address = req.body.address;
    const port = +req.body.port;
    const password = req.body.password;
    const method = req.body.method;
    const scale = req.body.scale;
    const shift = req.body.shift;
    // return serverManager.edit(serverId, name, address, port, password, method, scale, comment, shift);
    return serverManager.edit({
      id: serverId,
      name,
      host: address,
      port,
      password,
      method,
      scale,
      comment,
      shift,
    });
  }).then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};

exports.deleteServer = (req, res) => {
  const serverId = req.params.serverId;
  serverManager.del(serverId)
  .then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(403).end();
  });
};