// @flow
import _ from 'lodash'

import Sequelize from 'sequelize'

import { PubSub } from 'apollo-server'

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

  const rewriteHooks = (schemaOptions: any) => {

    let tableHooks = schemaOptions['table'] && schemaOptions['table']['hooks'] ? schemaOptions['table']['hooks'] : {};

    // 判断schema.options内是否设置了subscription参数,并定义了hook
    if (schemaOptions && schemaOptions['subscription'] && schemaOptions['subscription']['hooks']) {
      // && schemaOptions['table'] && schemaOptions['table'].hooks
      //重新定义table的hooks
      
      let subscriptionHooks = schemaOptions['subscription']['hooks'] || {}

      const pubSub: PubSub = schemaOptions['subscription']['pubSub']

      const baseSubscriptionHookFunction = (instance, {baseHookOptions: {pubSub, key}}) => {
        pubSub.publish(key, {instance})
      }

      // 遍历所有的subscriptionHooks
      _.forOwn(subscriptionHooks, (value, key) => {
        // subscriptionHook 未定义或者设置为false, 不做任何事情
        if (value) {
          // 判断订阅hook的执行方式
          let subscriptionHookFunction = null
          if (typeof value === 'boolean' && value === true) {
            if (!pubSub) {
              throw new Error('schema options subscription `pubSub` is not defined')
            }
            subscriptionHookFunction = baseSubscriptionHookFunction
          }
          if (typeof value === 'function') {
            subscriptionHookFunction = value
          }

          if (subscriptionHookFunction) {
            tableHooks[key] = (instance, options) => {
              // 当定义了table hooks, 则先执行hooks方法
              if (tableHooks[key]) {
                tableHooks[key](instance, options)
              }
              if (pubSub) {
                options = {
                  ...options,
                  baseHookOptions: {
                    key: `${key}SubscriptionKey`,
                    pubSub
                  }
                }
              }
              subscriptionHookFunction(instance, options)
            }
          }
        }
      })
    }
    console.log('tableHooks', tableHooks)
    return tableHooks
  } 

  // // console.log("Create Sequlize Model with config", model.name, dbDefinition, model.config.options["table"])
  const dbModel = sequelize.define(schema.name, dbDefinition, {
    ...schema.config.options['table'],
    hooks: rewriteHooks(schema.config.options)
  })

  return dbModel
}