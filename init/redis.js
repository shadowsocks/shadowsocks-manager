const config = appRequire('services/config').get('redis');
const Redis = require('ioredis');
const redis = new Redis({
  host: config.host,
  port: config.port || 6379,
  password: config.password,
  db: config.db || 0,
});
exports.redis = redis;
