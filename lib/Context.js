'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
// import * as graphql from 'graphql'


var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _graphqlRelay = require('graphql-relay');

var relay = _interopRequireWildcard(_graphqlRelay);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphql = require('graphql');

var _Schema = require('./definition/Schema');

var _Schema2 = _interopRequireDefault(_Schema);

var _Service = require('./definition/Service');

var _Service2 = _interopRequireDefault(_Service);

var _StringHelper = require('./utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

var _invariant = require('./utils/invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _transformer = require('./transformer');

var _transformer2 = _interopRequireDefault(_transformer);

var _SequelizeContext = require('./sequelize/SequelizeContext');

var _SequelizeContext2 = _interopRequireDefault(_SequelizeContext);

var _remote = require('./utils/remote');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Context = function () {
  function Context(sequelize, options, remoteCfg) {
    _classCallCheck(this, Context);

    this.dbContext = new _SequelizeContext2.default(sequelize);
    this.options = _extends({}, options);

    this.dbModels = {};
    this.schemas = {};
    this.services = {};
    this.graphQLObjectTypes = {};
    this.queries = {};
    this.mutations = {};

    this.connectionDefinitions = {};

    var self = this;
    this.nodeInterface = relay.nodeDefinitions(function (globalId) {
      var _relay$fromGlobalId = relay.fromGlobalId(globalId),
          type = _relay$fromGlobalId.type,
          id = _relay$fromGlobalId.id;
      // console.log('Warning-------------------- node id Fetcher not implement' + type + ' ' + id)

    }, function (obj) {
      var type = obj._type;
      return self.graphQLObjectTypes[type];
    }).nodeInterface;

    this.resolvers = {
      Query: {},
      Mutation: {}
    };

    this.remoteInfo = (0, _remote.buildBindings)(remoteCfg);
    this.remote_prefix = '_remote_';
  }

  _createClass(Context, [{
    key: 'getSGContext',
    value: function getSGContext() {
      var _this = this;

      // console.log('bindings:',this.remoteInfo['binding'])
      return {
        sequelize: this.dbContext.sequelize,
        models: _lodash2.default.mapValues(this.schemas, function (schema) {
          return _this.dbModel(schema.name);
        }),
        services: _lodash2.default.mapValues(this.services, function (service) {
          return service.config.statics;
        }),
        bindings: _extends({
          toGId: function toGId(type, id) {
            return relay.toGlobalId(type, id);
          },
          toDbId: function toDbId(type, id) {
            var gid = relay.fromGlobalId(id);
            if (gid.type !== type) {
              throw new Error('\u9519\u8BEF\u7684global id,type:' + type + ',gid:' + id);
            }
            return gid.id;
          }
        }, this.remoteInfo['binding'])
      };
    }
  }, {
    key: 'getTargetSchema',
    value: function getTargetSchema(modeName) {
      if (!this.remoteInfo['schema']) return;

      var target = undefined;
      _lodash2.default.forOwn(this.remoteInfo['schema'], function (value, key) {
        if (value && value.getType(modeName)) {
          target = value;
          return false;
        }
      });

      return target;
    }
  }, {
    key: 'addRemoteResolver',
    value: function addRemoteResolver(schemaName, fieldName, linkId, target) {
      // console.log('addRemoteResolver1:',schemaName,fieldName)
      if (!this.resolvers[schemaName]) this.resolvers[schemaName] = {};

      var self = this;
      this.resolvers[schemaName][fieldName] = {
        fragment: '... on ' + schemaName + ' { ' + linkId + ' }',
        resolve: function resolve(root, args, context, info) {
          var targetSchema = self.getTargetSchema(target);
          if (!_lodash2.default.isEmpty(targetSchema)) {
            var fn = self.wrapFieldResolve({
              name: fieldName,
              path: fieldName,
              $type: self.remoteGraphQLObjectType(target),
              resolve: function () {
                var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(root, args, context, info, sgContext) {
                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          if (!(root && root[linkId] && (typeof root[linkId] === 'number' || typeof root[linkId] === 'string'))) {
                            _context.next = 4;
                            break;
                          }

                          return _context.abrupt('return', info.mergeInfo.delegateToSchema({
                            schema: targetSchema,
                            operation: 'query',
                            fieldName: _StringHelper2.default.toInitialLowerCase(target),
                            args: {
                              id: root[linkId]
                            },
                            context: context,
                            info: info
                          }));

                        case 4:
                          return _context.abrupt('return', root[fieldName]);

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
            });

            return fn(root, args, context, info);
          }

          return root[fieldName];
        }
      };
    }
  }, {
    key: 'addSchema',
    value: function addSchema(schema) {
      var _this2 = this;

      if (this.schemas[schema.name]) {
        throw new Error('Schema ' + schema.name + ' already define.');
      }
      if (this.services[schema.name]) {
        throw new Error('Schema ' + schema.name + ' conflict with Service ' + schema.name);
      }
      if (schema.name.length >= 1 && (schema.name[0] === '_' || schema.name.endsWith('Id'))) {
        throw new Error('Schema "' + schema.name + '" must not begin with "_" or end with "Id", which is reserved by MGS');
      }
      this.schemas[schema.name] = schema;

      this.dbContext.applyPlugin(schema);

      schema.fields({
        createdAt: {
          $type: Date,
          initializable: false,
          mutable: false
        },
        updatedAt: {
          $type: Date,
          initializable: false,
          mutable: false
        }
      });

      _lodash2.default.forOwn(schema.config.queries, function (value, key) {
        if (!value['name']) {
          value['name'] = key;
        }
        _this2.addQuery(value);
      });

      _lodash2.default.forOwn(schema.config.mutations, function (value, key) {
        if (!value['name']) {
          value['name'] = key;
        }
        _this2.addMutation(value);
      });

      this.dbModel(schema.name);
    }
  }, {
    key: 'addService',
    value: function addService(service) {
      var self = this;
      if (self.services[service.name]) {
        throw new Error('Service ' + service.name + ' already define.');
      }
      if (self.schemas[service.name]) {
        throw new Error('Service ' + service.name + ' conflict with Schema ' + service.name);
      }
      service.statics({
        getSGContext: function getSGContext() {
          return self.getSGContext();
        }
      });
      self.services[service.name] = service;

      _lodash2.default.forOwn(service.config.queries, function (value, key) {
        if (!value['name']) {
          value['name'] = key;
        }
        self.addQuery(value);
      });

      _lodash2.default.forOwn(service.config.mutations, function (value, key) {
        if (!value['name']) {
          value['name'] = key;
        }
        self.addMutation(value);
      });
    }
  }, {
    key: 'addQuery',
    value: function addQuery(config) {
      if (this.queries[config.name]) {
        throw new Error('Query ' + config.name + ' already define.');
      }
      this.queries[config.name] = config;
    }
  }, {
    key: 'addMutation',
    value: function addMutation(config) {
      if (this.mutations[config.name]) {
        throw new Error('Mutation ' + config.name + ' already define.');
      }
      this.mutations[config.name] = config;
    }
  }, {
    key: 'remoteGraphQLObjectType',
    value: function remoteGraphQLObjectType(name) {
      var typeName = this.remote_prefix + name;
      if (!this.graphQLObjectTypes[typeName]) {
        var objectType = new _graphql.GraphQLObjectType({
          name: typeName,
          fields: {
            'id': {
              type: _graphql.GraphQLString,
              resolve: function resolve(root) {
                console.log('fake id', root);
                return 'MGS only fake ,not supported';
              }
            }
          }, //TODO support arguments
          description: JSON.stringify({
            target: name
          })
        });
        this.graphQLObjectTypes[typeName] = objectType;
      } else {}
      return this.graphQLObjectTypes[typeName];
    }
  }, {
    key: 'graphQLObjectType',
    value: function graphQLObjectType(name) {
      var model = this.schemas[name];
      if (!model) {
        throw new Error('Schema ' + name + ' not define.');
      } else {
        (0, _invariant2.default)(model.name === name, model.name + '\u4E0E' + name + '\u4E0D\u4E00\u81F4');
      }
      var typeName = name;

      if (!this.graphQLObjectTypes[typeName]) {
        var obj = Object.assign({
          id: {}
        }, model.config.fields, model.config.links);
        obj.id = {
          $type: new _graphql.GraphQLNonNull(_graphql.GraphQLID),
          resolve: function () {
            var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(root) {
              return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      return _context2.abrupt('return', relay.toGlobalId(_StringHelper2.default.toInitialUpperCase(model.name), root.id));

                    case 1:
                    case 'end':
                      return _context2.stop();
                  }
                }
              }, _callee2, this);
            }));

            function resolve(_x6) {
              return _ref2.apply(this, arguments);
            }

            return resolve;
          }()
        };
        var interfaces = [this.nodeInterface];
        var objectType = _transformer2.default.toGraphQLFieldConfig(typeName, '', obj, this, interfaces, true).type;
        if (objectType instanceof _graphql.GraphQLObjectType) {
          objectType.description = model.config.options.description;
          this.graphQLObjectTypes[typeName] = objectType;
        } else {
          (0, _invariant2.default)(false, 'wrong model format:' + name);
        }
      }
      return this.graphQLObjectTypes[typeName];
    }
  }, {
    key: 'dbModel',
    value: function dbModel(name) {
      var model = this.schemas[name];
      if (!model) {
        throw new Error('Schema ' + name + ' not define.');
      }
      var typeName = model.name;
      var self = this;
      if (!self.dbModels[typeName]) {
        self.dbModels[typeName] = self.dbContext.define(model);
        Object.assign(self.dbModels[typeName], _extends({}, model.config.statics, {
          getSGContext: function getSGContext() {
            return self.getSGContext();
          }
        }));
        Object.assign(self.dbModels[typeName].prototype, _extends({}, model.config.methods, {
          getSGContext: function getSGContext() {
            return self.getSGContext();
          }
        }));
      }
      return self.dbModels[typeName];
    }
  }, {
    key: 'wrapQueryResolve',
    value: function wrapQueryResolve(config) {
      var self = this;
      var hookFun = function hookFun(action, invokeInfo, next) {
        return next();
      };

      if (this.options.hooks != null) {
        this.options.hooks.reverse().forEach(function (hook) {
          if (!hook.filter || hook.filter({ type: 'query', config: config })) {
            var preHook = hookFun;
            hookFun = function hookFun(action, invokeInfo, next) {
              return hook.hook(action, invokeInfo, preHook.bind(null, action, invokeInfo, next));
            };
          }
        });
      }

      return function (source, args, context, info) {
        return hookFun({
          type: 'query',
          config: config
        }, {
          source: source,
          args: args,
          context: context,
          info: info,
          sgContext: self.getSGContext()
        }, function () {
          return config.resolve(args, context, info, self.getSGContext());
        });
      };
    }
  }, {
    key: 'wrapFieldResolve',
    value: function wrapFieldResolve(config) {
      var self = this;

      var hookFun = function hookFun(action, invokeInfo, next) {
        return next();
      };
      if (this.options.hooks != null) {
        this.options.hooks.reverse().forEach(function (hook) {
          if (!hook.filter || hook.filter({ type: 'field', config: config })) {
            var preHook = hookFun;
            hookFun = function hookFun(action, invokeInfo, next) {
              return hook.hook(action, invokeInfo, preHook.bind(null, action, invokeInfo, next));
            };
          }
        });
      }

      return function (source, args, context, info) {
        return hookFun({
          type: 'field',
          config: config
        }, {
          source: source,
          args: args,
          context: context,
          info: info,
          sgContext: self.getSGContext()
        }, function () {
          return config.resolve(source, args, context, info, self.getSGContext());
        });
      };
    }
  }, {
    key: 'wrapMutateAndGetPayload',
    value: function wrapMutateAndGetPayload(config) {
      var self = this;

      var hookFun = function hookFun(action, invokeInfo, next) {
        return next();
      };
      if (this.options.hooks != null) {
        this.options.hooks.reverse().forEach(function (hook) {
          if (!hook.filter || hook.filter({ type: 'mutation', config: config })) {
            var preHook = hookFun;
            hookFun = function hookFun(action, invokeInfo, next) {
              return hook.hook(action, invokeInfo, preHook.bind(null, action, invokeInfo, next));
            };
          }
        });
      }

      return function (args, context, info) {
        return hookFun({
          type: 'mutation',
          config: config
        }, {
          args: args,
          context: context,
          info: info,
          sgContext: self.getSGContext()
        }, function () {
          return config.mutateAndGetPayload(args, context, info, self.getSGContext());
        });
      };
    }
  }, {
    key: 'connectionDefinition',
    value: function connectionDefinition(schemaName) {
      if (!this.connectionDefinitions[schemaName]) {
        this.connectionDefinitions[schemaName] = relay.connectionDefinitions({
          name: _StringHelper2.default.toInitialUpperCase(schemaName),
          nodeType: this.graphQLObjectType(schemaName),
          connectionFields: {
            count: {
              type: _graphql.GraphQLFloat
            }
          }
        });
      }
      return this.connectionDefinitions[schemaName];
    }
  }, {
    key: 'connectionType',
    value: function connectionType(schemaName) {
      return this.connectionDefinition(schemaName).connectionType;
    }
  }, {
    key: 'edgeType',
    value: function edgeType(schemaName) {
      return this.connectionDefinition(schemaName).edgeType;
    }
  }, {
    key: 'buildModelAssociations',
    value: function buildModelAssociations() {
      var self = this;
      _lodash2.default.forOwn(self.schemas, function (schema, schemaName) {
        _lodash2.default.forOwn(schema.config.associations.hasMany, function (config, key) {
          var d = _extends({}, config, {
            as: key,
            foreignKey: config.foreignKey || config.foreignField + 'Id',
            through: undefined
          });
          self.dbModel(schema.name).hasMany(self.dbModel(config.target), d);
        });

        _lodash2.default.forOwn(schema.config.associations.belongsToMany, function (config, key) {
          self.dbModel(schema.name).belongsToMany(self.dbModel(config.target), _extends({}, config, {
            as: key,
            foreignKey: config.foreignField + 'Id',
            through: config.through && _extends({}, config.through, { model: self.dbModel(config.through.model) })
          }));
        });

        _lodash2.default.forOwn(schema.config.associations.hasOne, function (config, key) {
          self.dbModel(schema.name).hasOne(self.dbModel(config.target), _extends({}, config, {
            as: key,
            foreignKey: config.foreignKey || config.foreignField + 'Id'
          }));
        });

        _lodash2.default.forOwn(schema.config.associations.belongsTo, function (config, key) {
          self.dbModel(schema.name).belongsTo(self.dbModel(config.target), _extends({}, config, {
            as: key,
            foreignKey: config.foreignKey || config.foreignField + 'Id'
          }));
        });
      });
    }
  }]);

  return Context;
}();

exports.default = Context;