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
