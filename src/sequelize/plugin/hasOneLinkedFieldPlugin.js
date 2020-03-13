// @flow
const _ = require('lodash')

const StringHelper = require('../../utils/StringHelper')

module.exports = function hasOneFieldsConfig (schema, options) {
  _.forOwn(schema.config.associations.hasOne, (config, key) => {
    if (config.hidden) {
      return
    }
    schema.links({
      [key]: {
        config: config.config,
        $type: config.target,
        resolve: async function (root, args, context, info, sgContext) {
          if (root[key] != null) {
            return root[key]
          } else {
            return root['get' + StringHelper.toInitialUpperCase(key)]()
          }
        }
      }
    })
  })
}
