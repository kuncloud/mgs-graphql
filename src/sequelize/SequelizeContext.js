// @flow
const _ = require('lodash')

const toSequelizeModel = require('./toSequelizeModel.js')
const plugin = require('./plugin')

module.exports = class SequelizeContext {

  constructor (sequelize) {
    this.sequelize = sequelize
    this.plugins = {
      singularQuery: plugin.singularQueryPlugin,
      pluralQuery: plugin.pluralQueryPlugin,

      addMutation: plugin.addMutationPlugin,
      deleteMutation: plugin.deleteMutationPlugin,
      updateMutation: plugin.updateMutationPlugin,

      hasManyLinkedField: plugin.hasManyLinkedFieldPlugin,
      hasOneLinkedField: plugin.hasOneLinkedFieldPlugin
    }
  }

  define (schema) {
    return toSequelizeModel(this.sequelize, schema)
  }

  applyPlugin (schema) {
    // console.log(`addSchema:${schema.name}`)
    const defaultPluginConfig = {
      hasManyLinkedField: {},
      hasOneLinkedField: {}
    }
    // // console.log(schema)
    _.forOwn({...defaultPluginConfig, ...schema.config.options.plugin}, (value, key) => {
      if (this.plugins[key] && value) {
        this.plugins[key](schema, value)
      }
    })
  }

  /**
   * Query the model with specify args and return the connection data
   */
}
