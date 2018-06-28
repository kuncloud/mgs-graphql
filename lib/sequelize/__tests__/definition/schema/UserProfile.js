'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ = require('../../../../');

var _2 = _interopRequireDefault(_);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var UserType = 'User';
exports.default = _2.default.schema('UserProfile', {}).fields({
  owner: {
    $type: UserType,
    required: true
  },
  realName: String,
  age: _2.default.ScalarFieldTypes.Int,
  gender: {
    $type: String,
    enumValues: ['Male', 'Female']
  }
});