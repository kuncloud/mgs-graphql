'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ = require('../../../../');

var _2 = _interopRequireDefault(_);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _2.default.schema('User', {
  description: '用户',
  plugin: {
    addMutation: true,
    singularQuery: true,
    pluralQuery: true
  }
}).fields({
  userName: {
    $type: String,
    required: true
  },
  password: {
    $type: String,
    required: true
  },

  blocked: {
    $type: Boolean,
    default: false
  },
  registerAt: {
    $type: Date,
    default: function _default() {
      return new Date();
    }
  }
}).hasMany({
  dueTodos: {
    target: 'Todo',
    foreignField: 'owner',
    scope: {
      completed: false
    },
    sort: [{ field: 'createdAt', order: 'DESC' }]
  }
}).hasOne({
  profile: {
    target: 'UserProfile',
    foreignField: 'owner'
  }
});