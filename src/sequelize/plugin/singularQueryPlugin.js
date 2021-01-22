// @flow
const _ = require('lodash')

const { validateType } = require('../../utils/helper')
const RemoteSchema = require('../../definition/RemoteSchema')
const StringHelper = require('../../utils/StringHelper')

module.exports = function singularQuery (schema, options) {
  const name = StringHelper.toInitialLowerCase(schema.name)
  const searchFields = {
    id: {
      $type: schema.name + 'Id',
      description: 'Id of Schema ' + schema.name
    }
  }
  _.forOwn(schema.config.fields, (value, key) => {
    if (!value['$type'] || (value['searchable'] !== false && value['hidden'] !== true && !value['resolve'])) {
      if (value['unique']) {
        if (validateType(value['$type'], RemoteSchema)) {
          if (!key.endsWith('Id')) {
            key = key + 'Id'
          }
        }
        searchFields[key] = Object.assign({}, value, {required: false})
      }
    }
  })

  let config = {}
  if ((typeof options) === 'object') {
    config = options
  }

  schema.queries({
    [name]: {
      config: config,
      $type: schema.name,
      args: searchFields,
      resolve: async function (args, context, info, sgContext) {
        if (args === null || Object.keys(args).length === 0) {
          return null
        }
        // 先从dataloader取数据
        if (args.id && sgContext.dataLoader !== false && sgContext.loaders && sgContext.loaders[schema.name]) {
          return sgContext.loaders[schema.name].load(args.id)
        }
        return sgContext.models[schema.name].findOne({
          where: args
        })
      }
    }
  })
}
