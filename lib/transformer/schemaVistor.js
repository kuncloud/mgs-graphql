'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _graphql = require('graphql');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _graphqlTools = require('graphql-tools');

var _schemaVisitor = require('graphql-tools/dist/schemaVisitor');

var _invariant = require('../utils/invariant');

var _invariant2 = _interopRequireDefault(_invariant);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SchemaRemoteVisitor = function (_SchemaVisitor) {
  _inherits(SchemaRemoteVisitor, _SchemaVisitor);

  _createClass(SchemaRemoteVisitor, null, [{
    key: 'visitTheSchema',
    value: function visitTheSchema(schema) {
      var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Object.create(null);

      function visitorSelector(type, methodName) {

        var visitors = [];
        if (methodName != 'visitFieldDefinition') return visitors;

        //console.log(`visitorSelector :${type.name}:`)
        var isStub = function isStub(type) {
          return type instanceof _graphql.GraphQLObjectType && type.name.startsWith(context.prefix) && !_lodash2.default.isEmpty(type.description) && type.description.startsWith('{') && type.description.endsWith('}');
        };
        var remoteType = null;
        var visitedType = null;
        if (type.type instanceof _graphql.GraphQLList) {
          var element = type.type.ofType;
          if (isStub(element)) {
            visitedType = type;
            remoteType = element;
          }
        } else if (isStub(type.type)) {
          visitedType = type;
          remoteType = type.type;
        }

        if (null != remoteType && null != visitedType) {
          try {
            var info = JSON.parse(remoteType.description);
            if (!_lodash2.default.isEmpty(info)) {
              console.log('visitorSelector got it:' + visitedType.name + ',' + remoteType.name + ',' + methodName + ':', remoteType.description);
              visitors.push(new RemoteDirective({
                name: 'remote',
                args: _extends({}, info),
                visitedType: visitedType,
                schema: schema,
                context: context
              }));
              return visitors;
            }
          } catch (err) {
            console.warn('visitorSelector:', err);
          }
        }

        return visitors;
      }

      (0, _schemaVisitor.visitSchema)(schema, visitorSelector);

      (0, _schemaVisitor.healSchema)(schema);

      return schema;
    }
  }]);

  function SchemaRemoteVisitor(config) {
    _classCallCheck(this, SchemaRemoteVisitor);

    var _this = _possibleConstructorReturn(this, (SchemaRemoteVisitor.__proto__ || Object.getPrototypeOf(SchemaRemoteVisitor)).call(this));

    _this.name = config.name;
    _this.args = config.args;
    _this.visitedType = config.visitedType;
    _this.schema = config.schema;
    _this.context = config.context;
    return _this;
  }

  return SchemaRemoteVisitor;
}(_schemaVisitor.SchemaVisitor);

var RemoteDirective = function (_SchemaRemoteVisitor) {
  _inherits(RemoteDirective, _SchemaRemoteVisitor);

  function RemoteDirective() {
    _classCallCheck(this, RemoteDirective);

    return _possibleConstructorReturn(this, (RemoteDirective.__proto__ || Object.getPrototypeOf(RemoteDirective)).apply(this, arguments));
  }

  _createClass(RemoteDirective, [{
    key: 'visitFieldDefinition',
    value: function visitFieldDefinition(field) {
      // console.log('visit field:', field.name, this.visitedType.name)

      (0, _invariant2.default)(!_lodash2.default.isEmpty(this.args), 'Must provide args');
      var getTargetSchema = function getTargetSchema(modeName, srcSchemas) {
        if (_lodash2.default.isEmpty(srcSchemas)) return;

        for (var i = 0; i < srcSchemas.length; ++i) {
          var target = srcSchemas[i];
          if (target && target.getType(modeName)) {
            return target.getType(modeName);
          }
        }
      };

      var schemas = [].concat(_toConsumableArray(this.context.srcSchema), [this.schema]);
      var gqlObj = getTargetSchema(this.args.target, schemas);
      (0, _invariant2.default)((0, _graphql.isOutputType)(gqlObj), 'invalid remote link ' + field.name + ' => ' + this.args.target + ': not output type(maybe null)');

      if (gqlObj) {
        if (field.type instanceof _graphql.GraphQLList) {
          field.type = new _graphql.GraphQLList(gqlObj);
        } else {
          field.type = gqlObj;
        }

        //console.log('visit field:',field.resolve)
      }
    }
  }]);

  return RemoteDirective;
}(SchemaRemoteVisitor);

function mergeAllSchemas(schema, schemaMerged, resolvers, prefix) {
  SchemaRemoteVisitor.visitTheSchema(schema, {
    prefix: prefix,
    srcSchema: schemaMerged
  });
  var all = (0, _graphqlTools.mergeSchemas)({ schemas: [schema].concat(_toConsumableArray(schemaMerged)), resolvers: resolvers });
  // console.log('dd', schema.getQueryType().getFields()['test3'].type.name)
  // console.log('dd', all.getQueryType().getFields()['test3'].type.name)
  return all;
}

module.exports = {
  mergeAllSchemas: mergeAllSchemas
};