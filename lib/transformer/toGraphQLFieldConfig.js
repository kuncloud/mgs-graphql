'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphql = require('graphql');

var graphql = _interopRequireWildcard(_graphql);

var _graphqlRelay = require('graphql-relay');

var relay = _interopRequireWildcard(_graphqlRelay);

var _type = require('../type');

var _type2 = _interopRequireDefault(_type);

var _Context = require('../Context');

var _Context2 = _interopRequireDefault(_Context);

var _StringHelper = require('../utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

var _toGraphQLInputFieldMap = require('./toGraphQLInputFieldMap');

var _toGraphQLInputFieldMap2 = _interopRequireDefault(_toGraphQLInputFieldMap);

var _RemoteSchema = require('../definition/RemoteSchema');

var _RemoteSchema2 = _interopRequireDefault(_RemoteSchema);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var toGraphQLFieldConfig = function toGraphQLFieldConfig(name, postfix, fieldType, context) {
  var interfaces = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
  var remoteWithId = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;

  // console.log(`toGraphQLFieldConfig:${name},${postfix}`)
  var typeName = function typeName(path) {
    return path.replace(/\.\$type/g, '').replace(/\[\d*\]/g, '').split('.').map(function (v) {
      return _StringHelper2.default.toInitialUpperCase(v);
    }).join('');
  };

  if (graphql.isOutputType(fieldType)) {
    return { type: fieldType };
  }
  if (fieldType instanceof _type2.default.ScalarFieldType) {
    return { type: fieldType.graphQLOutputType };
  }
  switch (fieldType) {
    case String:
      return { type: graphql.GraphQLString };
    case Number:
      return { type: graphql.GraphQLFloat };
    case Boolean:
      return { type: graphql.GraphQLBoolean };
    case Date:
      return { type: _type2.default.GraphQLScalarTypes.Date };
    case JSON:
      return { type: _type2.default.GraphQLScalarTypes.Json };
  }

  if (_lodash2.default.isArray(fieldType)) {
    var elementType = toGraphQLFieldConfig(name, postfix, fieldType[0], context).type;
    var listType = new graphql.GraphQLList(elementType);
    return {
      type: listType,
      resolve: context.wrapFieldResolve({
        name: name.split('.').slice(-1)[0],
        path: name,
        $type: listType,
        resolve: function () {
          var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(root, args, context, info, sgContext) {
            var fieldName, records, result, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, cId, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, record;

            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    fieldName = name.split('.').slice(-1)[0];

                    if (!(typeof fieldType[0] === 'string' && sgContext.models[fieldType[0]] && root[fieldName] && root[fieldName].length > 0 && (typeof root[fieldName][0] === 'number' || typeof root[fieldName][0] === 'string'))) {
                      _context.next = 58;
                      break;
                    }

                    _context.next = 4;
                    return sgContext.models[fieldType[0]].findAll({ where: { id: _defineProperty({}, Sequelize.Op.in, root[fieldName]) } });

                  case 4:
                    records = _context.sent;
                    result = [];
                    _iteratorNormalCompletion = true;
                    _didIteratorError = false;
                    _iteratorError = undefined;
                    _context.prev = 9;
                    _iterator = root[fieldName][Symbol.iterator]();

                  case 11:
                    if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                      _context.next = 43;
                      break;
                    }

                    cId = _step.value;
                    _iteratorNormalCompletion2 = true;
                    _didIteratorError2 = false;
                    _iteratorError2 = undefined;
                    _context.prev = 16;
                    _iterator2 = records[Symbol.iterator]();

                  case 18:
                    if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                      _context.next = 26;
                      break;
                    }

                    record = _step2.value;

                    if (!(cId.toString() === record.id.toString())) {
                      _context.next = 23;
                      break;
                    }

                    result.push(record);
                    return _context.abrupt('break', 26);

                  case 23:
                    _iteratorNormalCompletion2 = true;
                    _context.next = 18;
                    break;

                  case 26:
                    _context.next = 32;
                    break;

                  case 28:
                    _context.prev = 28;
                    _context.t0 = _context['catch'](16);
                    _didIteratorError2 = true;
                    _iteratorError2 = _context.t0;

                  case 32:
                    _context.prev = 32;
                    _context.prev = 33;

                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                      _iterator2.return();
                    }

                  case 35:
                    _context.prev = 35;

                    if (!_didIteratorError2) {
                      _context.next = 38;
                      break;
                    }

                    throw _iteratorError2;

                  case 38:
                    return _context.finish(35);

                  case 39:
                    return _context.finish(32);

                  case 40:
                    _iteratorNormalCompletion = true;
                    _context.next = 11;
                    break;

                  case 43:
                    _context.next = 49;
                    break;

                  case 45:
                    _context.prev = 45;
                    _context.t1 = _context['catch'](9);
                    _didIteratorError = true;
                    _iteratorError = _context.t1;

                  case 49:
                    _context.prev = 49;
                    _context.prev = 50;

                    if (!_iteratorNormalCompletion && _iterator.return) {
                      _iterator.return();
                    }

                  case 52:
                    _context.prev = 52;

                    if (!_didIteratorError) {
                      _context.next = 55;
                      break;
                    }

                    throw _iteratorError;

                  case 55:
                    return _context.finish(52);

                  case 56:
                    return _context.finish(49);

                  case 57:
                    return _context.abrupt('return', result);

                  case 58:
                    return _context.abrupt('return', root[fieldName]);

                  case 59:
                  case 'end':
                    return _context.stop();
                }
              }
            }, _callee, this, [[9, 45, 49, 57], [16, 28, 32, 40], [33,, 35, 39], [50,, 52, 56]]);
          }));

          function resolve(_x3, _x4, _x5, _x6, _x7) {
            return _ref.apply(this, arguments);
          }

          return resolve;
        }()
      })
    };
  }

  if (fieldType instanceof _RemoteSchema2.default) {
    if (fieldType.name.endsWith('Id')) {
      return {
        type: graphql.GraphQLID,
        resolve: function () {
          var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(root) {
            var fieldName;
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    fieldName = name.split('.').slice(-1)[0];

                    if (!root[fieldName]) {
                      _context2.next = 5;
                      break;
                    }

                    return _context2.abrupt('return', relay.toGlobalId(fieldType.name.substr(0, fieldType.name.length - 'Id'.length), root[fieldName]));

                  case 5:
                    return _context2.abrupt('return', null);

                  case 6:
                  case 'end':
                    return _context2.stop();
                }
              }
            }, _callee2, this);
          }));

          function resolve(_x8) {
            return _ref2.apply(this, arguments);
          }

          return resolve;
        }()
      };
    } else {
      return {
        type: context.remoteGraphQLObjectType(fieldType.name)
      };
    }
  }

  if (typeof fieldType === 'string') {
    if (fieldType.endsWith('Id')) {
      return {
        type: graphql.GraphQLID,
        resolve: function () {
          var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(root) {
            var fieldName;
            return regeneratorRuntime.wrap(function _callee3$(_context3) {
              while (1) {
                switch (_context3.prev = _context3.next) {
                  case 0:
                    fieldName = name.split('.').slice(-1)[0];

                    if (!root[fieldName]) {
                      _context3.next = 5;
                      break;
                    }

                    return _context3.abrupt('return', relay.toGlobalId(fieldType.substr(0, fieldType.length - 'Id'.length), root[fieldName]));

                  case 5:
                    return _context3.abrupt('return', null);

                  case 6:
                  case 'end':
                    return _context3.stop();
                }
              }
            }, _callee3, this);
          }));

          function resolve(_x9) {
            return _ref3.apply(this, arguments);
          }

          return resolve;
        }()
      };
    } else if (fieldType.endsWith('Edge')) {
      return {
        type: context.edgeType(fieldType.substr(0, fieldType.length - 'Edge'.length))
      };
    } else if (fieldType.endsWith('Connection')) {
      return {
        // Add Relay Connection Args
        args: {
          after: {
            $type: String,
            description: '返回的记录应该在cursor:after之后'
          },
          first: {
            $type: Number,
            description: '指定最多返回记录的数量'
          },
          before: {
            $type: String
          },
          last: {
            $type: Number
          }
        },
        type: context.connectionType(fieldType.substr(0, fieldType.length - 'Connection'.length))
      };
    } else {
      return {
        type: context.graphQLObjectType(fieldType),
        resolve: context.wrapFieldResolve({
          name: name.split('.').slice(-1)[0],
          path: name,
          $type: context.graphQLObjectType(fieldType),
          resolve: function () {
            var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(root, args, context, info, sgContext) {
              var fieldName;
              return regeneratorRuntime.wrap(function _callee4$(_context4) {
                while (1) {
                  switch (_context4.prev = _context4.next) {
                    case 0:
                      fieldName = name.split('.').slice(-1)[0];

                      if (!_lodash2.default.isFunction(root['get' + _StringHelper2.default.toInitialUpperCase(fieldName)])) {
                        _context4.next = 7;
                        break;
                      }

                      if (!(root[fieldName] != null && root[fieldName].id != null)) {
                        _context4.next = 6;
                        break;
                      }

                      return _context4.abrupt('return', root[fieldName]);

                    case 6:
                      return _context4.abrupt('return', root['get' + _StringHelper2.default.toInitialUpperCase(fieldName)]());

                    case 7:
                      if (!(root && root[fieldName] && (typeof root[fieldName] === 'number' || typeof root[fieldName] === 'string'))) {
                        _context4.next = 9;
                        break;
                      }

                      return _context4.abrupt('return', sgContext.models[fieldType].findOne({ where: { id: root[fieldName] } }));

                    case 9:
                      return _context4.abrupt('return', root[fieldName]);

                    case 10:
                    case 'end':
                      return _context4.stop();
                  }
                }
              }, _callee4, this);
            }));

            function resolve(_x10, _x11, _x12, _x13, _x14) {
              return _ref4.apply(this, arguments);
            }

            return resolve;
          }()
        })
      };
    }
  }

  if (fieldType instanceof Object) {
    if (fieldType['$type']) {
      var result = toGraphQLFieldConfig(name, postfix, fieldType['$type'], context);
      if (fieldType['enumValues']) {
        var values = {};
        fieldType['enumValues'].forEach(function (t) {
          values[t] = { value: t };
        });
        result.type = new graphql.GraphQLEnumType({
          name: typeName(name) + postfix,
          values: values
        });
      }
      if (fieldType['required'] && !(result.type instanceof graphql.GraphQLNonNull)) {
        result.type = new graphql.GraphQLNonNull(result.type);
      }
      if (fieldType['resolve']) {
        var wrapConfig = {
          name: name.split('.').slice(-1)[0],
          path: name,
          $type: result.type,
          resolve: fieldType['resolve']
        };
        if (fieldType['config']) {
          wrapConfig['config'] = fieldType['config'];
        }
        result['resolve'] = context.wrapFieldResolve(wrapConfig);
      }
      if (fieldType.args || result.args) {
        result.args = (0, _toGraphQLInputFieldMap2.default)(typeName(name), _extends({}, result.args, fieldType.args));
      }
      result.description = fieldType['description'];
      return result;
    } else {
      var objType = new graphql.GraphQLObjectType({
        name: typeName(name) + postfix,
        interfaces: interfaces,
        fields: function fields() {
          var fields = {};
          _lodash2.default.forOwn(fieldType, function (value, key) {
            if (value['$type'] && value['hidden']) {} else {
              if (remoteWithId && !value.isLinkField && value['$type'] instanceof _RemoteSchema2.default && !value['$type'].name.endsWith('Id')) {
                var linkId = _StringHelper2.default.toInitialLowerCase(key) + 'Id';
                fields[linkId] = {
                  type: graphql.GraphQLID,
                  resolve: function () {
                    var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(root) {
                      return regeneratorRuntime.wrap(function _callee5$(_context5) {
                        while (1) {
                          switch (_context5.prev = _context5.next) {
                            case 0:
                              if (!root[linkId]) {
                                _context5.next = 4;
                                break;
                              }

                              return _context5.abrupt('return', relay.toGlobalId(value['$type'].name, root[linkId]));

                            case 4:
                              return _context5.abrupt('return', root[linkId]);

                            case 5:
                            case 'end':
                              return _context5.stop();
                          }
                        }
                      }, _callee5, this);
                    }));

                    function resolve(_x15) {
                      return _ref5.apply(this, arguments);
                    }

                    return resolve;
                  }()
                };

                context.addRemoteResolver(name, key, linkId, value['$type'].name);
              }

              fields[key] = toGraphQLFieldConfig(name + postfix + '.' + key, '', value, context);
            }
          });
          return fields;
        }
      });
      return {
        type: objType,
        resolve: context.wrapFieldResolve({
          name: name.split('.').slice(-1)[0],
          path: name,
          $type: objType,
          resolve: function () {
            var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(root) {
              return regeneratorRuntime.wrap(function _callee6$(_context6) {
                while (1) {
                  switch (_context6.prev = _context6.next) {
                    case 0:
                      return _context6.abrupt('return', root[name.split('.').slice(-1)[0]]);

                    case 1:
                    case 'end':
                      return _context6.stop();
                  }
                }
              }, _callee6, this);
            }));

            function resolve(_x16) {
              return _ref6.apply(this, arguments);
            }

            return resolve;
          }()
        })
      };
    }
  }
  throw new Error('Unsupported type: ' + fieldType);
};

exports.default = toGraphQLFieldConfig;