'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = singularQuery;

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

var _graphql = require('graphql');

var graphql = _interopRequireWildcard(_graphql);

var _Schema = require('../../definition/Schema');

var _Schema2 = _interopRequireDefault(_Schema);

var _StringHelper = require('../../utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function singularQuery(schema, options) {
  var name = _StringHelper2.default.toInitialLowerCase(schema.name);
  var searchFields = {
    id: {
      $type: schema.name + 'Id',
      description: 'Id of Schema ' + schema.name
    }
  };
  _.forOwn(schema.config.fields, function (value, key) {
    if (!value['$type'] || value['searchable'] !== false && value['hidden'] !== true && !value['resolve']) {
      if (value['unique']) {
        searchFields[key] = Object.assign({}, value, { required: false });
      }
    }
  });

  var config = {};
  if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
    config = options;
  }

  schema.queries(_defineProperty({}, name, {
    config: config,
    $type: schema.name,
    args: searchFields,
    resolve: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(args, context, info, sgContext) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(args === null || Object.keys(args).length === 0)) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt('return', null);

              case 2:
                return _context.abrupt('return', sgContext.models[schema.name].findOne({
                  where: _extends({}, args)
                }));

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function resolve(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
      }

      return resolve;
    }()
  }));
}