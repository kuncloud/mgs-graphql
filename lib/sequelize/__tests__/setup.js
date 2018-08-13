'use strict';

require('./schema');

var _sequelize = require('./sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _data = require('./data');

var _data2 = _interopRequireDefault(_data);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
/* eslint-env jest */


beforeAll(_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return _sequelize2.default.sync({
            force: true
          });

        case 2:
          _context.next = 4;
          return (0, _data2.default)(_sequelize2.default);

        case 4:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, undefined);
})));

afterAll(function () {});