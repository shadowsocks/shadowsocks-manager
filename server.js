require('babel-core/register');

require('./init/utils');
require('./init/log');
require('./init/moveConfigFile');
require('./init/knex');
require('./init/checkConfig');

require('./models/flow');
require('./models/account');

require('./init/loadServices');

const log4js = require('log4js');
const logger = log4js.getLogger('init');

logger.info('Server start.');
