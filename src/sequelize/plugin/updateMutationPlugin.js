// @flow
const _ = require('lodash')

const StringHelper = require('../../utils/StringHelper')
const RemoteSchema = require('../../definition/RemoteSchema')
const { validateType } = require('../../utils/helper')

module.exports = function updateMutation (schema, options) {
  const name = 'update' + StringHelper.toInitialUpperCase(schema.name)
  const changedName = 'changed' + StringHelper.toInitialUpperCase(schema.name)

  const inputFields = {
    id: {
      $type: schema.name + 'Id',
      required: true
    },
    values: {}
  }
  _.forOwn(schema.config.fields, (value, key) => {
    if (validateType(value) || validateType(value, RemoteSchema)) {
      if (!key.endsWith('Id')) {
        key = key + 'Id'
      }
    }
    if (value && value.$type) {
      if (!value.hidden && value.mutable !== false) {
        inputFields.values[key] = {...value, required: false, default: null}
      }
    } else {
      inputFields.values[key] = value
    }
  })

  let config = {}
  if ((typeof options) === 'object') {
    config = options
  }

  schema.mutations({
    [name]: {
      config: config,
      inputFields: inputFields,
      outputFields: {
        [changedName]: schema.name
      },
      mutateAndGetPayload: async function (args, context, info, sgContext) {
        if (args == null || args.values == null) {
          throw new Error('Missing update values.')
        }
        const dbModel = sgContext.models[schema.name]
        const values = {}

        _.forOwn(schema.config.fields, (value, key) => {
          if (validateType(value) || validateType(value, RemoteSchema)) {
            if (!key.endsWith('Id')) {
              key = key + 'Id'
            }
            if (typeof args.values[key] !== 'undefined') {
              values[StringHelper.toUnderscoredName(key)] = args.values[key]
              values[key] = args.values[key]
            }
          } else if (typeof args.values[key] !== 'undefined') {
            values[key] = args.values[key]
          }
        })

        const instance = await dbModel.findOne({where: {id: args.id}})
        if (!instance) {
          throw new Error(schema.name + '[' + args.id + '] not exist.')
        } else {
          await instance.update(values)
        }
        return {
          [changedName]: instance
        }
      }
    }
  })
}
