'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ = require('../../../../');

var _2 = _interopRequireDefault(_);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var gWeather = '晴天';

exports.default = _2.default.service('DemoService').queries({
  weather: {
    $type: String,
    resolve: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(args, context, info) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt('return', gWeather);

              case 1:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function resolve(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
      }

      return resolve;
    }()
  }
}).mutations({
  setWeather: {
    inputFields: {
      weather: {
        $type: String,
        required: true
      }
    },
    outputFields: {
      weather: {
        $type: String,
        required: true
      }
    },
    mutateAndGetPayload: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(_ref3, context, info) {
        var weather = _ref3.weather;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                gWeather = weather;
                return _context2.abrupt('return', {
                  weather: gWeather
                });

              case 2:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function mutateAndGetPayload(_x4, _x5, _x6) {
        return _ref2.apply(this, arguments);
      }

      return mutateAndGetPayload;
    }()
  }
});