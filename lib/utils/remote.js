'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.buildBindings = buildBindings;

var _apolloLinkHttp = require('apollo-link-http');

var _graphql = require('graphql');

var _graphqlTools = require('graphql-tools');

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _fileHelper = require('./fileHelper');

var fsHelper = _interopRequireWildcard(_fileHelper);

var _graphqlBinding = require('graphql-binding');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var protocol = 'http';

// async function remoteSchemasFromURI(endPoint: String): GraphQLSchema {
//   console.log('remoteSchemasFromURI call:', endPoint)
//   const link = new HttpLink({uri: endPoint, fetch})
//   const rSchema = await introspectSchema(link)
//   const schema: GraphQLSchema  = makeRemoteExecutableSchema({
//     schema: rSchema,
//     link: link
//   })
//   // assertValidSchema(schema)
//   return schema
// }

function remoteSchemasFromFile(endPoint, gqlFile) {
  console.log('remoteSchemasFromFile call:', endPoint, gqlFile, __dirname);
  if (!gqlFile.endsWith('.gql')) throw new Error('Must postfix with .gql');

  if (!fsHelper.isFile(gqlFile)) {
    gqlFile = _path2.default.resolve(__dirname, gqlFile);
    console.warn('gql file add current path ', gqlFile);
  }

  var gql = _fs2.default.readFileSync(gqlFile, { flag: 'r+', encoding: 'utf-8' });
  // console.log(gql)
  var link = new _apolloLinkHttp.HttpLink({ uri: endPoint, fetch: _nodeFetch2.default });
  var schema = (0, _graphqlTools.makeRemoteExecutableSchema)({
    schema: gql,
    link: link
  });
  // assertValidSchema(schema)
  return schema;
}

function endPoint(_ref) {
  var host = _ref.host,
      port = _ref.port,
      path = _ref.path;

  return protocol + '://' + host + ':' + port + '/' + path;
}

var MyBinding = function (_Binding) {
  _inherits(MyBinding, _Binding);

  function MyBinding(schema) {
    _classCallCheck(this, MyBinding);

    return _possibleConstructorReturn(this, (MyBinding.__proto__ || Object.getPrototypeOf(MyBinding)).call(this, {
      schema: schema
    }));
  }

  return MyBinding;
}(_graphqlBinding.Binding);

// const EndPoints = {
//   common: {
//     uri: {
//       host: '127.0.0.1',
//       port: '4002',
//       path: 'graphql'
//     },
//     gql:{
//       path:'gql/common.gql'
//     }
//   }
// }
function buildBindings(cfg) {
  if (_lodash2.default.isEmpty(cfg)) return {};

  var binding = {};

  _lodash2.default.forOwn(cfg, function (value, key) {
    if (key.startsWith('__')) return true;

    // console.log('binding cfg:',key,value)
    var schema = remoteSchemasFromFile(endPoint(value.uri), value.gql.path);
    // const schema = await remoteSchemasFromURI(endPoint(value.uri))
    binding['schema'] = _extends({}, binding['schema'], _defineProperty({}, key, schema));

    binding['binding'] = _extends({}, binding['binding'], _defineProperty({}, key, new MyBinding(schema)));
  });

  return binding;
}

// module.exports = {
//   buildBindings,
//   endPoint,
//   remoteSchemasFromURI,
//   remoteSchemasFromFile
// }