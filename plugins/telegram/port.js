'use strict';

const telegram = appRequire('plugins/telegram/index').telegram;

telegram.on('manager', console.log);
