'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphql = require('graphql');

var _graphqlRelay = require('graphql-relay');

var relay = _interopRequireWildcard(_graphqlRelay);

var _invariant = require('./utils/invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _Schema = require('./definition/Schema');

var _Schema2 = _interopRequireDefault(_Schema);

var _Service = require('./definition/Service');

var _Service2 = _interopRequireDefault(_Service);

var _type = require('./type');

var _type2 = _interopRequireDefault(_type);

var _Context = require('./Context');

var _Context2 = _interopRequireDefault(_Context);

var _StringHelper = require('./utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

var _Connection = require('./utils/Connection');

var _Connection2 = _interopRequireDefault(_Connection);

var _transformer = require('./transformer');

var _transformer2 = _interopRequireDefault(_transformer);

var _RemoteSchema = require('./definition/RemoteSchema');

var _RemoteSchema2 = _interopRequireDefault(_RemoteSchema);

var _schemaVistor = require('./transformer/schemaVistor');

var _remote = require('./utils/remote');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var SimpleGraphQL = {

  /** Available values:
   * <table style='text-align: left'>
   *   <tr><th>Name</th><th>GraphQL Type</th><th>DB Type</th></tr>
   *   <tr><td>Id</td><td>GraphQLID</td><td>Sequelize.INTEGER</td></tr>
   *   <tr><td>String</td><td>GraphQLString</td><td>Sequelize.STRING</td></tr>
   *   <tr><td>Float</td><td>GraphQLFloat</td><td>Sequelize.DOUBLE</td></tr>
   *   <tr><td>Int</td><td>GraphQLInt</td><td>Sequelize.INTEGER</td></tr>
   *   <tr><td>Boolean</td><td>GraphQLBoolean</td><td>Sequelize.BOOLEAN</td></tr>
   *   <tr><td>Date</td><td>GraphQLScalarTypes.Date</td><td>Sequelize.DATE</td></tr>
   *   <tr><td>JSON</td><td>GraphQLScalarTypes.Json</td><td>Sequelize.JSONB</td></tr>
   * </table>
   *
   */
  ScalarFieldTypes: _type2.default.ScalarFieldTypes,

  Schema: _Schema2.default,

  Connection: _Connection2.default,

  Service: _Service2.default,

  //RemoteLinkConfig: RemoteLinkConfig,

  /**
   * Define a Schema
   *
   * @param name
   * @param options
   */
  schema: function schema(name) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return new _Schema2.default(name, options);
  },

  service: function service(name) {
    return new _Service2.default(name);
  },

  remoteSchema: function remoteSchema(name) {
    return new _RemoteSchema2.default(name);
  },

  /**
   * Build the GraphQL Schema
   */
  build: function build(args) {
    var sequelize = args.sequelize,
        _args$schemas = args.schemas,
        schemas = _args$schemas === undefined ? [] : _args$schemas,
        _args$services = args.services,
        services = _args$services === undefined ? [] : _args$services,
        _args$options = args.options,
        options = _args$options === undefined ? {} : _args$options,
        _args$remoteCfg = args.remoteCfg,
        remoteCfg = _args$remoteCfg === undefined ? {} : _args$remoteCfg;


    var context = new _Context2.default(sequelize, options, remoteCfg);

    // 添加Schema
    schemas.forEach(function (schema) {
      context.addSchema(schema);
    });

    // 添加Service
    services.forEach(function (service) {
      context.addService(service);
    });

    context.buildModelAssociations();

    var finalQueries = {};

    _lodash2.default.forOwn(context.queries, function (value, key) {
      var fieldConfig = _transformer2.default.toGraphQLFieldConfig(key, 'Payload', value.$type, context);

      finalQueries[key] = {
        type: fieldConfig.type,
        resolve: context.wrapQueryResolve(value),
        description: value.description
      };
      if (value.args || fieldConfig.args) {
        finalQueries[key].args = _transformer2.default.toGraphQLInputFieldMap(_StringHelper2.default.toInitialUpperCase(key), _extends({}, fieldConfig.args, value.args));
      }
    });

    var viewerConfig = _lodash2.default.get(options, 'query.viewer', 'AllQuery');
    if (viewerConfig === 'AllQuery') {
      context.graphQLObjectTypes['Viewer'] = new _graphql.GraphQLObjectType({
        name: 'Viewer',
        interfaces: [context.nodeInterface],
        fields: function fields() {
          var fields = {
            id: { type: new _graphql.GraphQLNonNull(_graphql.GraphQLID) }
          };
          _lodash2.default.forOwn(finalQueries, function (value, key) {
            if (key !== 'viewer' && key !== 'relay') fields[key] = value;
          });
          return fields;
        }
      });

      finalQueries['viewer'] = {
        description: 'Default Viewer implement to include all queries.',
        type: new _graphql.GraphQLNonNull(context.graphQLObjectTypes['Viewer']),
        resolve: function resolve() {
          return {
            _type: 'Viewer',
            id: relay.toGlobalId('Viewer', 'viewer')
          };
        }
      };
    } else if (viewerConfig === 'FromModelQuery') {
      if (!finalQueries['viewer']) {
        throw new Error('Build option has config "query.view=FromModelQuery" but query "viewer" not defined.');
      }
      // TODO check whether viewer.type is a Node
    } else {
      var fieldConfig = _transformer2.default.toGraphQLFieldConfig('viewer', 'Payload', viewerConfig.$type, context);
      finalQueries['viewer'] = {
        type: fieldConfig.type,
        resolve: context.wrapQueryResolve(viewerConfig),
        description: viewerConfig.description
      };
    }

    finalQueries['node'] = {
      name: 'node',
      description: 'Fetches an object given its ID',
      type: context.nodeInterface,
      args: {
        id: {
          type: new _graphql.GraphQLNonNull(_graphql.GraphQLID),
          description: 'The ID of an object'
        }
      },
      resolve: context.wrapQueryResolve({
        name: 'node',
        $type: context.nodeInterface,
        resolve: function () {
          var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(args, context, info, sgContext, invoker) {
            var id, record;
            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    id = relay.fromGlobalId(args.id);

                    if (!(id.type === 'Viewer')) {
                      _context.next = 4;
                      break;
                    }

                    if (!(finalQueries['viewer'] && finalQueries['viewer'].resolve)) {
                      _context.next = 4;
                      break;
                    }

                    return _context.abrupt('return', finalQueries['viewer'].resolve(null, args, context, info));

                  case 4:
                    if (sgContext.models[id.type]) {
                      _context.next = 6;
                      break;
                    }

                    return _context.abrupt('return', null);

                  case 6:
                    _context.next = 8;
                    return sgContext.models[id.type].findOne({ where: { id: id.id } });

                  case 8:
                    record = _context.sent;

                    if (record) {
                      record._type = id.type;
                    }
                    return _context.abrupt('return', record);

                  case 11:
                  case 'end':
                    return _context.stop();
                }
              }
            }, _callee, this);
          }));

          function resolve(_x2, _x3, _x4, _x5, _x6) {
            return _ref.apply(this, arguments);
          }

          return resolve;
        }()
      })
    };

    var rootQuery = new _graphql.GraphQLObjectType({
      name: 'Query',
      fields: function fields() {
        return finalQueries;
      }
    });

    finalQueries['relay'] = {
      description: 'Hack to workaround https://github.com/facebook/relay/issues/112 re-exposing the root query object',
      type: new _graphql.GraphQLNonNull(rootQuery),
      resolve: function resolve() {
        return {};
      }
    };

    var rootMutation = new _graphql.GraphQLObjectType({
      name: 'Mutation',
      fields: function fields() {
        var fields = {};
        _lodash2.default.forOwn(context.mutations, function (value, key) {
          var inputFields = _transformer2.default.toGraphQLInputFieldMap(_StringHelper2.default.toInitialUpperCase(key), value.inputFields);
          var outputFields = {};
          var payloadFields = _lodash2.default.get(options, 'mutation.payloadFields', []);
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = payloadFields[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var field = _step.value;

              if (typeof field === 'string') {
                if (!finalQueries[field]) {
                  throw new Error('Incorrect buildOption. Query[' + field + '] not exist.');
                }
                outputFields[field] = finalQueries[field];
              } else {
                outputFields[field.name] = field;
              }
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }

          _lodash2.default.forOwn(value.outputFields, function (fValue, fKey) {
            outputFields[fKey] = _transformer2.default.toGraphQLFieldConfig(key + '.' + fKey, 'Payload', fValue, context);
          });
          if (!value['name']) {
            value['name'] = key;
          }
          fields[key] = _transformer2.default.mutationWithClientMutationId({
            name: _StringHelper2.default.toInitialUpperCase(key),
            inputFields: inputFields,
            outputFields: outputFields,
            mutateAndGetPayload: context.wrapMutateAndGetPayload(value),
            description: value.doc
          });
        });
        return fields;
      }
    });

    var schema = new _graphql.GraphQLSchema({
      query: rootQuery,
      mutation: rootMutation
    });

    var schemaMerged = [];
    if (!_lodash2.default.isEmpty(context.remoteInfo) && !_lodash2.default.isEmpty(context.remoteInfo['schema'])) {
      _lodash2.default.forOwn(context.remoteInfo['schema'], function (value, key) {
        schemaMerged.push(value);
      });
    }

    schema = (0, _schemaVistor.mergeAllSchemas)(schema, schemaMerged, context.resolvers, context.remote_prefix);

    return {
      sgContext: context.getSGContext(),
      graphQLSchema: schema
    };
  }
};

exports.default = SimpleGraphQL;