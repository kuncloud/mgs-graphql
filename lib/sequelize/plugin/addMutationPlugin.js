'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = addMutation;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphql = require('graphql');

var graphql = _interopRequireWildcard(_graphql);

var _Schema = require('../../definition/Schema');

var _Schema2 = _interopRequireDefault(_Schema);

var _StringHelper = require('../../utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

var _RemoteSchema = require('../../definition/RemoteSchema');

var _RemoteSchema2 = _interopRequireDefault(_RemoteSchema);

var _helper = require('../../utils/helper');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function addMutation(schema, options) {
  var name = 'add' + _StringHelper2.default.toInitialUpperCase(schema.name);
  var addedName = 'added' + _StringHelper2.default.toInitialUpperCase(schema.name) + 'Edge';

  var inputFields = {};
  _lodash2.default.forOwn(schema.config.fields, function (value, key) {
    if ((0, _helper.validateType)(value) || (0, _helper.validateType)(value, _RemoteSchema2.default)) {
      if (!key.endsWith('Id')) {
        key = key + 'Id';
      }
    }
    if (value && value.$type) {
      if (!value.hidden && value.initializable !== false) {
        inputFields[key] = value;
      }
    } else {
      inputFields[key] = value;
    }
  });
  var config = {};
  if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
    config = options;
  }
  schema.mutations(_defineProperty({}, name, {
    config: config,
    inputFields: inputFields,
    outputFields: _defineProperty({}, addedName, schema.name + 'Edge'),
    mutateAndGetPayload: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(args, context, info, sgContext) {
        var dbModel, attrs, instance;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                dbModel = sgContext.models[schema.name];
                attrs = {};


                _lodash2.default.forOwn(schema.config.fields, function (value, key) {
                  if ((0, _helper.validateType)(value) || (0, _helper.validateType)(value, _RemoteSchema2.default)) {
                    if (!key.endsWith('Id')) {
                      key = key + 'Id';
                    }
                    if (typeof args[key] !== 'undefined') {
                      attrs[_StringHelper2.default.toUnderscoredName(key)] = args[key];
                      attrs[key] = args[key];
                    }
                  } else if (typeof args[key] !== 'undefined') {
                    attrs[key] = args[key];
                  }
                });

                _context.next = 5;
                return dbModel.create(attrs);

              case 5:
                instance = _context.sent;
                return _context.abrupt('return', _defineProperty({}, addedName, {
                  node: instance,
                  cursor: instance.id
                }));

              case 7:
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