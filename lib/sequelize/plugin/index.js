'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _singularQueryPlugin = require('./singularQueryPlugin');

var _singularQueryPlugin2 = _interopRequireDefault(_singularQueryPlugin);

var _pluralQueryPlugin = require('./pluralQueryPlugin');

var _pluralQueryPlugin2 = _interopRequireDefault(_pluralQueryPlugin);

var _addMutationPlugin = require('./addMutationPlugin');

var _addMutationPlugin2 = _interopRequireDefault(_addMutationPlugin);

var _deleteMutationPlugin = require('./deleteMutationPlugin');

var _deleteMutationPlugin2 = _interopRequireDefault(_deleteMutationPlugin);

var _updateMutationPlugin = require('./updateMutationPlugin');

var _updateMutationPlugin2 = _interopRequireDefault(_updateMutationPlugin);

var _hasManyLinkedFieldPlugin = require('./hasManyLinkedFieldPlugin');

var _hasManyLinkedFieldPlugin2 = _interopRequireDefault(_hasManyLinkedFieldPlugin);

var _hasOneLinkedFieldPlugin = require('./hasOneLinkedFieldPlugin');

var _hasOneLinkedFieldPlugin2 = _interopRequireDefault(_hasOneLinkedFieldPlugin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  singularQueryPlugin: _singularQueryPlugin2.default,
  pluralQueryPlugin: _pluralQueryPlugin2.default,

  addMutationPlugin: _addMutationPlugin2.default,
  deleteMutationPlugin: _deleteMutationPlugin2.default,
  updateMutationPlugin: _updateMutationPlugin2.default,

  hasManyLinkedFieldPlugin: _hasManyLinkedFieldPlugin2.default,
  hasOneLinkedFieldPlugin: _hasOneLinkedFieldPlugin2.default

};