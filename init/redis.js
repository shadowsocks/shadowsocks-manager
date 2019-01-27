const config = appRequire('services/config').get('redis');
const Redis = require('ioredis');
const redis = new Redis(config);
exports.redis = redis;
