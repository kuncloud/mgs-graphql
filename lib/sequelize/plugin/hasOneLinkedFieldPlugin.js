'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = hasOneFieldsConfig;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Schema = require('../../definition/Schema');

var _Schema2 = _interopRequireDefault(_Schema);

var _StringHelper = require('../../utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function hasOneFieldsConfig(schema, options) {
  // Conver model association to field config

  _lodash2.default.forOwn(schema.config.associations.hasOne, function (config, key) {
    if (config.hidden) {
      return;
    }
    schema.links(_defineProperty({}, key, {
      config: config.config,
      $type: config.target,
      resolve: function () {
        var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(root, args, context, info, sgContext) {
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  if (!(root[key] != null)) {
                    _context.next = 4;
                    break;
                  }

                  return _context.abrupt('return', root[key]);

                case 4:
                  return _context.abrupt('return', root['get' + _StringHelper2.default.toInitialUpperCase(key)]());

                case 5:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        function resolve(_x, _x2, _x3, _x4, _x5) {
          return _ref.apply(this, arguments);
        }

        return resolve;
      }()
    }));
  });
}