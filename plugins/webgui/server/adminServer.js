const manager = appRequire('services/manager');
const serverManager = appRequire('plugins/flowSaver/server');
const webguiTag = appRequire('plugins/webgui_tag');
const knex = appRequire('init/knex').knex;
const log4js = require('log4js');
const logger = log4js.getLogger('webgui');
const { body, validationResult } = require('express-validator');

exports.getServers = async (req, res) => {
  try {
    const servers = await serverManager.list({
      status: !!req.query.status,
    });
    res.send(servers);
  } catch (err) {
    logger.error(err);
    res.status(500).end();
  }
};

exports.getOneServer = async (req, res) => {
  try {
    const serverId = req.params.serverId;
    const noPort = req.query.noPort;
    const result = await knex('server').select().where({ id: +serverId });
    if (result.length) {
      const server = result[0];
      if (!noPort) {
        const ports = await manager.send({ command: 'list' }, { host: server.host, port: server.port, password: server.password });
        server.ports = ports;
      }
      res.send(server);
    } else {
      res.status(404).end();
    }
  } catch (err) {
    logger.error(err);
    res.status(500).end();
  }
};

exports.addServer = async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() });
  }
  try {
    const { type, name, comment, address, port, password, method, scale, shift, key, net, wgPort, tjPort, pluginOptions } = req.body;
    const isWG = type === 'WireGuard';
    const isTj = type === 'Trojan';
    
    await manager.send({ command: 'flow', options: { clear: false } }, { host: address, port, password });
    
    const [serverId] = await serverManager.add({
      type,
      name,
      host: address,
      port,
      password,
      method,
      scale,
      comment,
      shift: isWG ? 0 : shift,
      key: isWG ? key : null,
      net: isWG ? net : null,
      wgPort: isWG ? wgPort : null,
      tjPort: isTj ? tjPort : null,
      pluginOptions,
    });
    res.send({ serverId });
  } catch (err) {
    logger.error(err);
    res.status(403).end();
  }
};

exports.editServer = async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() });
  }
  try {
    const { serverId } = req.params;
    const { type, name, comment, address, port, password, method, scale, shift, key, net, wgPort, tjPort, pluginOptions, check } = req.body;
    const isWG = type === 'WireGuard';
    const isTj = type === 'Trojan';
    
    await manager.send({ command: 'flow', options: { clear: false } }, { host: address, port, password });
    
    await serverManager.edit({
      id: serverId,
      type,
      name,
      host: address,
      port,
      password,
      method,
      scale,
      comment,
      shift: isWG ? 0 : shift,
      key: isWG ? key : null,
      net: isWG ? net : null,
      wgPort: isWG ? wgPort : null,
      tjPort: isTj ? tjPort : null,
      pluginOptions,
      check,
    });
    res.send('success');
  } catch (err) {
    logger.error(err);
    res.status(403).end();
  }
};

exports.deleteServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    await serverManager.del(serverId);
    res.send('success');
  } catch (err) {
    logger.error(err);
    res.status(403).end();
  }
};

exports.getTags = async (req, res) => {
  try {
    const { type, key } = req.query;
    const tags = await webguiTag.getTags(type, +key);
    res.send(tags);
  } catch (err) {
    logger.error(err);
    res.status(403).end();
  }
};

exports.setTags = async (req, res) => {
  try {
    const { type, key, tags } = req.body;
    await webguiTag.setTags(type, +key, tags);
    res.send('success');
  } catch (err) {
    logger.error(err);
    res.status(403).end();
  }
};
