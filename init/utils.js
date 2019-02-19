const path = require('path');
const cluster = require('cluster');
const process = require('process');
global.appRequire = filePath => require(path.resolve(__dirname, '../' + filePath));
global.isMainWorker = () => (+cluster.worker.id) === (+process.env.mainWorker);
