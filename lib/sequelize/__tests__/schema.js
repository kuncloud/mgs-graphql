'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _buildSchema = require('./buildSchema');

var _buildSchema2 = _interopRequireDefault(_buildSchema);

var _sequelize = require('./sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (0, _buildSchema2.default)(_sequelize2.default).graphQLSchema;