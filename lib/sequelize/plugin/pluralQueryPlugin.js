'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = pluralQuery;

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

var _graphql = require('graphql');

var graphql = _interopRequireWildcard(_graphql);

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _Schema = require('../../definition/Schema');

var _Schema2 = _interopRequireDefault(_Schema);

var _type = require('../../type');

var _type2 = _interopRequireDefault(_type);

var _StringHelper = require('../../utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

var _resolveConnection = require('../resolveConnection');

var _resolveConnection2 = _interopRequireDefault(_resolveConnection);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var SortEnumType = new graphql.GraphQLEnumType({
  name: 'SortOrder',
  values: {
    ASC: { value: 'ASC', description: '递增排序' },
    DESC: { value: 'DESC', description: '递减排序' }
  }
});

var DateConditionType = new graphql.GraphQLInputObjectType({
  name: 'DateCondition' + 'Input',
  fields: {
    gte: {
      type: _type2.default.GraphQLScalarTypes.Date,
      description: '大于或等于'
    },
    lte: {
      type: _type2.default.GraphQLScalarTypes.Date,
      description: '小于或等于'
    },
    gt: {
      type: _type2.default.GraphQLScalarTypes.Date,
      description: '大于'
    },
    lt: {
      type: _type2.default.GraphQLScalarTypes.Date,
      description: '小于'
    },
    ne: {
      type: _type2.default.GraphQLScalarTypes.Date,
      description: '不等于'
    },
    eq: {
      type: _type2.default.GraphQLScalarTypes.Date,
      description: '等于'
    }
  }
});

var NumberConditionType = new graphql.GraphQLInputObjectType({
  name: 'NumberCondition' + 'Input',
  fields: {
    gte: {
      type: graphql.GraphQLFloat,
      description: '大于或等于'
    },
    lte: {
      type: graphql.GraphQLFloat,
      description: '小于或等于'
    },
    gt: {
      type: graphql.GraphQLFloat,
      description: '大于'
    },
    lt: {
      type: graphql.GraphQLFloat,
      description: '小于'
    },
    ne: {
      type: graphql.GraphQLFloat,
      description: '不等于'
    },
    eq: {
      type: graphql.GraphQLFloat,
      description: '等于'
    },
    in: {
      type: new graphql.GraphQLList(graphql.GraphQLFloat),
      description: '在里面'
    },
    notIn: {
      type: new graphql.GraphQLList(graphql.GraphQLFloat),
      description: '不在里面'
    }
  }
});

var StringConditionType = new graphql.GraphQLInputObjectType({
  name: 'StringCondition' + 'Input',
  fields: {
    gte: {
      type: graphql.GraphQLString,
      description: '大于或等于'
    },
    lte: {
      type: graphql.GraphQLString,
      description: '小于或等于'
    },
    gt: {
      type: graphql.GraphQLString,
      description: '大于'
    },
    lt: {
      type: graphql.GraphQLString,
      description: '小于'
    },
    ne: {
      type: graphql.GraphQLString,
      description: '不等于'
    },
    eq: {
      type: graphql.GraphQLString,
      description: '等于'
    },
    in: {
      type: new graphql.GraphQLList(graphql.GraphQLString),
      description: '在里面'
    },
    nin: {
      type: new graphql.GraphQLList(graphql.GraphQLString),
      description: '不在里面'
    }
  }
});

function pluralQuery(schema, options) {
  var name = _StringHelper2.default.toInitialLowerCase(schema.name) + 's';

  var searchFields = {};
  var conditionFieldKeys = [];
  // 过滤不可搜索的field
  _.forOwn(schema.config.fields, function (value, key) {
    if (typeof value === 'string' || value && typeof value.$type === 'string') {
      if (!key.endsWith('Id')) {
        key = key + 'Id';
      }
    }
    if (!value['$type'] || value['searchable'] !== false && value['hidden'] !== true && !value['resolve']) {
      if (value['required']) {
        searchFields[key] = Object.assign({}, value, { required: false });
      } else {
        searchFields[key] = value;
      }
      if (value['default'] != null) {
        searchFields[key] = Object.assign({}, searchFields[key], { default: null });
      }
      if (value['advancedSearchable']) {
        if (value['$type'] === Date) {
          conditionFieldKeys.push(key);
          searchFields[key] = Object.assign({}, searchFields[key], { $type: DateConditionType });
        } else if (value['$type'] === Number) {
          conditionFieldKeys.push(key);
          searchFields[key] = Object.assign({}, searchFields[key], { $type: NumberConditionType });
        } else if (value['$type'] === String) {
          conditionFieldKeys.push(key);
          searchFields[key] = Object.assign({}, searchFields[key], { $type: StringConditionType });
        }
      }
    }
  });

  if (options && options.conditionArgs) {
    Object.assign(searchFields, options.conditionArgs);
  }

  var config = {};
  if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
    config = options;
  }

  // 生产
  schema.queries(_defineProperty({}, name, {
    config: config,
    $type: schema.name + 'Connection',
    args: {
      condition: {
        $type: _.mapValues(searchFields, function (value) {
          var type = value;
          while (type['$type'] || _.isArray(type)) {
            if (type['$type']) {
              type = type['$type'];
            } else if (_.isArray(type)) {
              type = type[0];
            }
          }
          if (value['$type']) {
            type = Object.assign({}, value, { $type: type, required: false });
          }
          if (type === Date || type['$type'] === Date) {
            type = DateConditionType;
          }
          return type;
        }),
        description: 'Query Condition'
      },
      sort: {
        $type: [{ field: String, order: SortEnumType }],
        description: 'Define the sort field'
      },
      keywords: {
        fields: {
          $type: [String],
          required: true
        },
        value: {
          $type: String,
          required: true
        }
      }
    },
    resolve: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(args, context, info, sgContext) {
        var dbModel, _ref2, _ref2$sort, sort, _ref2$condition, condition, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item, include, includeFields, associationType, _args$keywords, fields, value, keywordsCondition, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, field, fieldName, type, colFieldName;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                dbModel = sgContext.models[schema.name];
                _ref2 = args != null ? args : {}, _ref2$sort = _ref2.sort, sort = _ref2$sort === undefined ? [{ field: 'id', order: 'ASC' }] : _ref2$sort, _ref2$condition = _ref2.condition, condition = _ref2$condition === undefined ? {} : _ref2$condition;

                if (!dbModel.options.underscored) {
                  _context.next = 22;
                  break;
                }

                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context.prev = 6;

                for (_iterator = sort[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  item = _step.value;

                  item.field = _StringHelper2.default.toUnderscoredName(item.field);
                }
                _context.next = 14;
                break;

              case 10:
                _context.prev = 10;
                _context.t0 = _context['catch'](6);
                _didIteratorError = true;
                _iteratorError = _context.t0;

              case 14:
                _context.prev = 14;
                _context.prev = 15;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 17:
                _context.prev = 17;

                if (!_didIteratorError) {
                  _context.next = 20;
                  break;
                }

                throw _iteratorError;

              case 20:
                return _context.finish(17);

              case 21:
                return _context.finish(14);

              case 22:

                conditionFieldKeys.forEach(function (fieldKey) {
                  if (condition[fieldKey]) {
                    condition[fieldKey] = _.mapKeys(condition[fieldKey], function (value, key) {
                      return '$' + key;
                    });
                  }
                });

                include = [];
                includeFields = {};

                associationType = function associationType(model, fieldName) {
                  if (model.config.associations.hasOne[fieldName]) {
                    return model.config.associations.hasOne[fieldName].target;
                  }
                  if (model.config.associations.belongsTo[fieldName]) {
                    return model.config.associations.belongsTo[fieldName].target;
                  }
                  return null;
                };

                _.forOwn(schema.config.fields, function (value, key) {
                  if (typeof value === 'string' || value && typeof value.$type === 'string') {
                    if (typeof condition[key] !== 'undefined') {
                      if (!includeFields[key]) {
                        var type = associationType(schema, key);
                        includeFields[key] = true;
                        include.push({
                          model: sgContext.models[type],
                          as: key,
                          required: true
                        });
                      }
                      if (!condition.$and) {
                        condition.$and = [];
                      }
                      Object.keys(condition[key]).forEach(function (f) {
                        if (dbModel.options.underscored) {
                          condition.$and.push(_sequelize2.default.where(_sequelize2.default.col(key + '.' + _StringHelper2.default.toUnderscoredName(f)), { $eq: condition[key][f] }));
                        } else {
                          condition.$and.push(_sequelize2.default.where(_sequelize2.default.col(key + '.' + f), { $eq: condition[key][f] }));
                        }
                      });
                      delete condition[key];
                    }

                    if (!key.endsWith('Id')) {
                      key = key + 'Id';
                    }
                    if (typeof condition[key] !== 'undefined') {
                      if (dbModel.options.underscored) {
                        var underscoredKey = _StringHelper2.default.toUnderscoredName(key);
                        if (underscoredKey !== key) {
                          condition[underscoredKey] = condition[key];
                          delete condition[key];
                        }
                      }
                    }
                  }
                });

                if (!(args && args.keywords)) {
                  _context.next = 50;
                  break;
                }

                _args$keywords = args.keywords, fields = _args$keywords.fields, value = _args$keywords.value;
                keywordsCondition = [];
                _iteratorNormalCompletion2 = true;
                _didIteratorError2 = false;
                _iteratorError2 = undefined;
                _context.prev = 33;


                for (_iterator2 = fields[Symbol.iterator](); !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                  field = _step2.value;

                  if (field.indexOf('.') !== -1) {
                    fieldName = field.split('.')[0];
                    type = associationType(schema, fieldName);

                    if (type) {
                      if (!includeFields[fieldName]) {
                        includeFields[fieldName] = true;
                        include.push({
                          model: sgContext.models[type],
                          as: fieldName,
                          required: false
                        });
                      }
                      colFieldName = field;

                      if (dbModel.options.underscored) {
                        colFieldName = fieldName + _StringHelper2.default.toUnderscoredName(field.substr(field.indexOf('.')));
                      }
                      keywordsCondition.push(_sequelize2.default.where(_sequelize2.default.col(colFieldName), { $like: '%' + value + '%' }));
                    } else {
                      keywordsCondition.push(_defineProperty({}, field, { $like: '%' + value + '%' }));
                    }
                  } else {
                    keywordsCondition.push(_defineProperty({}, field, { $like: '%' + value + '%' }));
                  }
                }
                _context.next = 41;
                break;

              case 37:
                _context.prev = 37;
                _context.t1 = _context['catch'](33);
                _didIteratorError2 = true;
                _iteratorError2 = _context.t1;

              case 41:
                _context.prev = 41;
                _context.prev = 42;

                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                  _iterator2.return();
                }

              case 44:
                _context.prev = 44;

                if (!_didIteratorError2) {
                  _context.next = 47;
                  break;
                }

                throw _iteratorError2;

              case 47:
                return _context.finish(44);

              case 48:
                return _context.finish(41);

              case 49:
                condition.$or = keywordsCondition;

              case 50:
                return _context.abrupt('return', (0, _resolveConnection2.default)(dbModel, _extends({}, args, { condition: condition, include: include })));

              case 51:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[6, 10, 14, 22], [15,, 17, 21], [33, 37, 41, 49], [42,, 44, 48]]);
      }));

      function resolve(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
      }

      return resolve;
    }()
  }));
}