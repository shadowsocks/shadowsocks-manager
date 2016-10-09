'use strict';

require('babel-core/register');

require('./init/utils');
require('./init/log');
require('./init/moveConfigFile');
require('./init/checkConfig');
require('./init/knex');

require('./models/flow');
require('./models/account');

require('./init/loadServices');
require('./init/loadPlugins');

const log4js = require('log4js');
const logger = log4js.getLogger('init');

logger.info('Server start.');
