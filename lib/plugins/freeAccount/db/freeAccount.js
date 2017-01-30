'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const knex = appRequire('init/knex').knex;
const tableName = 'freeAccount';

const config = appRequire('services/config').all();
const createTable = (() => {
  var _ref = _asyncToGenerator(function* () {
    if (config.empty) {
      yield knex.schema.dropTableIfExists(tableName);
    }
    return knex.schema.createTableIfNotExists(tableName, function (table) {
      table.string('address').primary();
      table.string('email');
      table.integer('port');
      table.integer('flow');
      table.integer('currentFlow');
      table.dateTime('time');
      table.dateTime('expired');
      table.boolean('isDisabled');
    });
  });

  return function createTable() {
    return _ref.apply(this, arguments);
  };
})();

exports.createTable = createTable;