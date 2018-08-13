'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = deleteMutation;

var _graphql = require('graphql');

var graphql = _interopRequireWildcard(_graphql);

var _graphqlRelay = require('graphql-relay');

var relay = _interopRequireWildcard(_graphqlRelay);

var _Schema = require('../../definition/Schema');

var _Schema2 = _interopRequireDefault(_Schema);

var _StringHelper = require('../../utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function deleteMutation(schema, options) {
  var _outputFields;

  var name = 'delete' + _StringHelper2.default.toInitialUpperCase(schema.name);
  var config = {};
  if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
    config = options;
  }
  schema.mutations(_defineProperty({}, name, {
    config: config,
    inputFields: {
      id: {
        $type: schema.name + 'Id',
        required: true
      }
    },
    outputFields: (_outputFields = {
      ok: Boolean
    }, _defineProperty(_outputFields, 'deleted' + schema.name, schema.name), _defineProperty(_outputFields, 'deleted' + schema.name + 'Id', graphql.GraphQLID), _outputFields),
    mutateAndGetPayload: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(_ref2, context, info, sgContext) {
        var id = _ref2.id;

        var entity, _ref3;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return sgContext.models[schema.name].findOne({ where: { id: id } });

              case 2:
                entity = _context.sent;

                if (!entity) {
                  _context.next = 7;
                  break;
                }

                _context.next = 6;
                return entity.destroy();

              case 6:
                return _context.abrupt('return', (_ref3 = {}, _defineProperty(_ref3, 'deleted' + schema.name, entity), _defineProperty(_ref3, 'deleted' + schema.name + 'Id', relay.toGlobalId(schema.name, id)), _defineProperty(_ref3, 'ok', true), _ref3));

              case 7:
                throw new Error(schema.name + '[' + id + '] not exist.');

              case 8:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function mutateAndGetPayload(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
      }

      return mutateAndGetPayload;
    }()
  }));
}