// @flow
const _ = require('lodash')

const StringHelper = require('../../utils/StringHelper')
const RemoteSchema = require('../../definition/RemoteSchema')
const { validateType } = require('../../utils/helper')

module.exports = function addMutation (schema, options) {
  const name = 'add' + StringHelper.toInitialUpperCase(schema.name)
  const addedName = 'added' + StringHelper.toInitialUpperCase(schema.name) + 'Edge'

  const inputFields = {}
  _.forOwn(schema.config.fields, (value, key) => {
    if (validateType(value) || validateType(value, RemoteSchema)) {
      if (!key.endsWith('Id')) {
        key = key + 'Id'
      }
    }
    if (value && value.$type) {
      if (!value.hidden && value.initializable !== false) {
        inputFields[key] = value
      }
    } else {
      inputFields[key] = value
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
        [addedName]: schema.name + 'Edge'
      },
      mutateAndGetPayload: async function (args, context, info, sgContext) {
        const dbModel = sgContext.models[schema.name]
        const attrs = {}

        _.forOwn(schema.config.fields, (value, key) => {
          if (validateType(value) || validateType(value, RemoteSchema)) {
            if (!key.endsWith('Id')) {
              key = key + 'Id'
            }
            if (typeof args[key] !== 'undefined') {
              attrs[StringHelper.toUnderscoredName(key)] = args[key]
              attrs[key] = args[key]
            }
          } else if (typeof args[key] !== 'undefined') {
            attrs[key] = args[key]
          }
        })

        const instance = await dbModel.create(attrs)
        return {
          [addedName]: {
            node: instance,
            cursor: instance.id
          }
        }
      }
    }
  })
}
