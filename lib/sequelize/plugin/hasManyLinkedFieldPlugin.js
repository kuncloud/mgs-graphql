'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = hasManyLinkedField;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _invariant = require('../../utils/invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _Schema = require('../../definition/Schema');

var _Schema2 = _interopRequireDefault(_Schema);

var _RemoteSchema = require('../../definition/RemoteSchema');

var _RemoteSchema2 = _interopRequireDefault(_RemoteSchema);

var _resolveConnection = require('../resolveConnection');

var _resolveConnection2 = _interopRequireDefault(_resolveConnection);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
// import StringHelper from '../../utils/StringHelper'

function hasManyLinkedField(schema, options) {
  // const name = StringHelper.toInitialLowerCase(schema.name)
  // Conver model association to field config
  _lodash2.default.forOwn(schema.config.associations.hasMany, function (config, key) {
    if (config.hidden) {
      return;
    }

    (0, _invariant2.default)(!(config.target instanceof _RemoteSchema2.default), 'unsupported remote schema as has many target:${schema.name}:${key},coming soon');
    var args = {};
    if (config.conditionFields) {
      args['condition'] = config.conditionFields;
    }
    if (config.outputStructure === 'Array') {
      schema.links(_defineProperty({}, key, {
        config: config.config,
        args: args,
        $type: [config.target],
        resolve: function () {
          var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(root, args, context, info, sgContext) {
            var condition, sort, sourceKey, foreignKey;
            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    condition = config.scope || {};

                    if (args && args.condition) {
                      condition = _extends({}, condition, args.condition);
                    }
                    sort = config.sort || [{ field: 'id', order: 'ASC' }];
                    sourceKey = config.sourceKey || 'id';
                    foreignKey = config.foreignKey || config.foreignField + 'Id';

                    condition[foreignKey] = root[sourceKey];

                    return _context.abrupt('return', sgContext.models[config.target].findAll({
                      where: condition,
                      order: sort.map(function (s) {
                        return [s.field, s.order];
                      })
                    }));

                  case 7:
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
    } else {
      schema.links(_defineProperty({}, key, {
        config: config.config,
        args: args,
        $type: config.target + 'Connection',
        resolve: function () {
          var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(root, args, context, info, sgContext) {
            var condition, sort, sourceKey, foreignKey;
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    condition = args && args.condition || {};

                    if (config.scope) {
                      condition = _extends({}, condition, config.scope);
                    }
                    sort = config.sort || [{ field: 'id', order: 'ASC' }];
                    // if (models[hasManyCfg.target].options.underscored) {
                    //  condition[StringHelper.toUnderscoredName(_.get(hasManyCfg, 'options.foreignKey', name + 'Id'))] = root.id
                    //  for (let item of sort) {
                    //    item.field = StringHelper.toUnderscoredName(item.field)
                    //  }
                    // } else {

                    sourceKey = config.sourceKey || 'id';
                    foreignKey = config.foreignKey || config.foreignField + 'Id';

                    condition[foreignKey] = root[sourceKey];

                    // }
                    return _context2.abrupt('return', (0, _resolveConnection2.default)(sgContext.models[config.target], _extends({}, args, { condition: condition, sort: sort })));

                  case 7:
                  case 'end':
                    return _context2.stop();
                }
              }
            }, _callee2, this);
          }));

          function resolve(_x6, _x7, _x8, _x9, _x10) {
            return _ref2.apply(this, arguments);
          }

          return resolve;
        }()
      }));
    }
  });
}