'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const knex = appRequire('init/knex').knex;
const tableName = 'flow';

const config = appRequire('services/config').all();
const createTable = (() => {
  var _ref = _asyncToGenerator(function* () {
    if (config.empty) {
      yield knex.schema.dropTableIfExists(tableName);
    }
    const exist = yield knex.schema.hasTable(tableName);
    if (exist) {
      return;
    }
    return knex.schema.createTableIfNotExists(tableName, function (table) {
      table.integer('port');
      table.integer('flow');
      table.bigInteger('time');
    });
  });

  return function createTable() {
    return _ref.apply(this, arguments);
  };
})();

exports.createTable = createTable;