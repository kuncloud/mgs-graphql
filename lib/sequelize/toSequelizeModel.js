'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = toSequelizeModel;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _type = require('../type');

var _type2 = _interopRequireDefault(_type);

var _Schema = require('../definition/Schema');

var _Schema2 = _interopRequireDefault(_Schema);

var _StringHelper = require('../utils/StringHelper');

var _StringHelper2 = _interopRequireDefault(_StringHelper);

var _RemoteSchema = require('../definition/RemoteSchema');

var _RemoteSchema2 = _interopRequireDefault(_RemoteSchema);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function toSequelizeModel(sequelize, schema) {
  var dbDefinition = {};

  var dbType = function dbType(fieldType) {
    if (fieldType instanceof _type2.default.ScalarFieldType) {
      return fieldType.columnType;
    }
    if (fieldType instanceof _RemoteSchema2.default) {
      return _sequelize2.default.INTEGER;
    }
    switch (fieldType) {
      case String:
        return _sequelize2.default.STRING;
      case Number:
        return _sequelize2.default.DOUBLE;
      case Boolean:
        return _sequelize2.default.BOOLEAN;
      case Date:
        return _sequelize2.default.DATE(6);
      case JSON:
        return _sequelize2.default.JSON;
    }

    return _sequelize2.default.JSON;
  };

  _lodash2.default.forOwn(schema.config.fields, function (value, key) {
    var fType = value;
    if (value && value['$type']) {
      fType = value['$type'];
    }
    if (typeof fType === 'string') {
      var foreignField = key;
      var foreignFieldId = key + 'Id';
      var onDelete = 'RESTRICT';
      if (value && value['$type'] && value.column) {
        if (value.column.onDelete) {
          onDelete = value.column.onDelete;
        }
      }
      if (value && value['$type'] && value.required) {
        schema.belongsTo(_defineProperty({}, key, {
          target: fType,
          hidden: true,
          foreignField: foreignField,
          foreignKey: { name: foreignFieldId, field: _StringHelper2.default.toUnderscoredName(foreignFieldId), allowNull: false },
          onDelete: onDelete,
          constraints: true
        }));
      } else {
        schema.belongsTo(_defineProperty({}, key, {
          target: fType,
          hidden: true,
          foreignField: foreignField,
          foreignKey: { name: foreignFieldId, field: _StringHelper2.default.toUnderscoredName(foreignFieldId) },
          onDelete: onDelete,
          constraints: true
        }));
      }
    } else {
      var type = dbType(fType);
      if (type) {
        if (type === _sequelize2.default.JSON) {
          console.warn('please ensure the json field:', key);
        }

        if (value && value['$type']) {
          if (fType instanceof _RemoteSchema2.default) {
            console.log('schema db mode ' + schema.name + ' generate remote ref:' + key + ' => ' + (key + 'Id') + ' ');
            if (!fType.name.endsWith('Id') || !key.endsWith('Id')) {
              key = key + 'Id';
            }
          }
          dbDefinition[key] = { type: type };
          if (value.required != null) {
            dbDefinition[key].allowNull = !value.required;
          }
          if (value.default != null) {
            dbDefinition[key].defaultValue = value.default;
          }
          if (value.validate != null) {
            dbDefinition[key].validate = value.validate;
          }
          if (value.enumValues != null) {
            dbDefinition[key].type = _sequelize2.default.ENUM.apply(_sequelize2.default, _toConsumableArray(value.enumValues));
          }
          dbDefinition[key] = _extends({}, dbDefinition[key], value.column);
        } else {
          dbDefinition[key] = { type: type };
        }
        if (sequelize.options.define.underscored && dbDefinition[key].field == null) {
          dbDefinition[key].field = _StringHelper2.default.toUnderscoredName(key);
        }
      } else {
        throw new Error('Unknown column type for ' + fType);
      }
    }
  });

  // schema定义中的indexes的field驼峰名称改为下划线来新建table
  if (schema.config.options['table'] && schema.config.options['table']['indexes']) {
    schema.config.options['table']['indexes'].forEach(function (item) {
      var tempFields = [];
      if (!!item['unique'] && !!item['fields']) {
        item['fields'].forEach(function (field) {
          tempFields.push(field.replace(/([A-Z])/g, "_$1").toLowerCase());
        });
      }
      item['fields'] = tempFields;
    });
  }

  // // console.log("Create Sequlize Model with config", model.name, dbDefinition, model.config.options["table"])
  var dbModel = sequelize.define(schema.name, dbDefinition, schema.config.options['table']);
  return dbModel;
}