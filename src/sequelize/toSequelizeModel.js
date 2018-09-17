// @flow
import _ from 'lodash'

import Sequelize from 'sequelize'

import Type from '../type'
import Schema from '../definition/Schema'
import StringHelper from '../utils/StringHelper'
import ModelRef from '../definition/RemoteSchema'
export default function toSequelizeModel (sequelize:Sequelize, schema:Schema<any>):Sequelize.Model {
  const dbDefinition = {}

  const dbType = (fieldType:any) => {
    if (fieldType instanceof Type.ScalarFieldType) {
      return fieldType.columnType
    }
    if (fieldType instanceof ModelRef) {
      return Sequelize.INTEGER
    }
    switch (fieldType) {
      case String:
        return Sequelize.STRING
      case Number:
        return Sequelize.DOUBLE
      case Boolean:
        return Sequelize.BOOLEAN
      case Date:
        return Sequelize.DATE(6)
      case JSON:
        return Sequelize.JSON
    }

    return Sequelize.JSON
  }

  _.forOwn(schema.config.fields, (value, key) => {
    let fType = value
    if (value && value['$type']) {
      fType = value['$type']
    }
    if (typeof fType === 'string') {
      let foreignField = key
      let foreignFieldId = key + 'Id'
      let onDelete = 'RESTRICT'
      if (value && value['$type'] && value.column) {
        if (value.column.onDelete) {
          onDelete = value.column.onDelete
        }
      }
      if (value && value['$type'] && value.required) {
        schema.belongsTo({
          [key]: {
            target: fType,
            hidden: true,
            foreignField: foreignField,
            foreignKey: {name: foreignFieldId, field: StringHelper.toUnderscoredName(foreignFieldId), allowNull: false},
            onDelete: onDelete,
            constraints: true
          }
        })
      } else {
        schema.belongsTo({
          [key]: {
            target: fType,
            hidden: true,
            foreignField: foreignField,
            foreignKey: {name: foreignFieldId, field: StringHelper.toUnderscoredName(foreignFieldId)},
            onDelete: onDelete,
            constraints: true
          }
        })
      }
    } else {
      const type = dbType(fType)
      if (type) {
        if (type === Sequelize.JSON) {
          console.warn('please ensure the json field:', key)
        }

        if (value && value['$type']) {
          if (fType instanceof ModelRef) {
            // console.log(`schema db mode ${schema.name} generate remote ref:${key} => ${key + 'Id'} `)
            if (!fType.name.endsWith('Id') || !key.endsWith('Id')) {
              key = key + 'Id'
            }
          }
          dbDefinition[key] = {type: type}
          if (value.required != null) {
            dbDefinition[key].allowNull = !value.required
          }
          if (value.default != null) {
            dbDefinition[key].defaultValue = value.default
          }
          if (value.validate != null) {
            dbDefinition[key].validate = value.validate
          }
          if (value.enumValues != null) {
            dbDefinition[key].type = Sequelize.ENUM(...value.enumValues)
          }
          dbDefinition[key] = {...dbDefinition[key], ...value.column}
        } else {
          dbDefinition[key] = {type: type}
        }
        if (sequelize.options.define.underscored && dbDefinition[key].field == null) {
          dbDefinition[key].field = StringHelper.toUnderscoredName(key)
        }
      } else {
        throw new Error('Unknown column type for ' + fType)
      }
    }
  })

  // schema定义中的indexes的field驼峰名称改为下划线来新建table
  if (schema.config.options['table'] && schema.config.options['table']['indexes']) {
    schema.config.options['table']['indexes'].forEach((item) => {
      let tempFields = []
      if (!!item['unique'] && !!item['fields']) {
        item['fields'].forEach((field) => {
          tempFields.push(field.replace(/([A-Z])/g, '_$1').toLowerCase())
        })
      }
      item['fields'] = tempFields
    })
  }

  // // console.log("Create Sequlize Model with config", model.name, dbDefinition, model.config.options["table"])
  const dbModel = sequelize.define(schema.name, dbDefinition, schema.config.options['table'])
  return dbModel
}
