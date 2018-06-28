'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _Schema = require('../definition/Schema');

var _Schema2 = _interopRequireDefault(_Schema);

var _toSequelizeModel = require('./toSequelizeModel.js');

var _toSequelizeModel2 = _interopRequireDefault(_toSequelizeModel);

var _plugin = require('./plugin');

var _plugin2 = _interopRequireDefault(_plugin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SequelizeContext = function () {
  function SequelizeContext(sequelize) {
    _classCallCheck(this, SequelizeContext);

    this.sequelize = sequelize;
    this.plugins = {
      singularQuery: _plugin2.default.singularQueryPlugin,
      pluralQuery: _plugin2.default.pluralQueryPlugin,

      addMutation: _plugin2.default.addMutationPlugin,
      deleteMutation: _plugin2.default.deleteMutationPlugin,
      updateMutation: _plugin2.default.updateMutationPlugin,

      hasManyLinkedField: _plugin2.default.hasManyLinkedFieldPlugin,
      hasOneLinkedField: _plugin2.default.hasOneLinkedFieldPlugin
    };
  }

  _createClass(SequelizeContext, [{
    key: 'define',
    value: function define(schema) {
      return (0, _toSequelizeModel2.default)(this.sequelize, schema);
    }
  }, {
    key: 'applyPlugin',
    value: function applyPlugin(schema) {
      var _this = this;

      console.log('addSchema:' + schema.name);
      var defaultPluginConfig = {
        hasManyLinkedField: {},
        hasOneLinkedField: {}
        // console.log(schema)
      };_lodash2.default.forOwn(_extends({}, defaultPluginConfig, schema.config.options.plugin), function (value, key) {
        if (_this.plugins[key] && value) {
          _this.plugins[key](schema, value);
        }
      });
    }

    /**
     * Query the model with specify args and return the connection data
     */

  }]);

  return SequelizeContext;
}();

exports.default = SequelizeContext;