// @flow
import _ from 'lodash'
import * as graphql from 'graphql'

import Schema from '../../definition/Schema'
import RemoteSchema from '../../definition/RemoteSchema'
import StringHelper from '../../utils/StringHelper'

export default function addMutation (schema:Schema<any>, options:any):void {
  const name = 'add' + StringHelper.toInitialUpperCase(schema.name)
  const addedName = 'added' + StringHelper.toInitialUpperCase(schema.name) + 'Edge'

  const validateType = (value, type = String) => {
    return (typeof value) === type || (value && (typeof value.$type) === type)
  }

  const inputFields = {}
  _.forOwn(schema.config.fields, (value, key) => {
    if (validateType(value)) {
      if (!key.endsWith('Id')) {
        key = key + 'Id'
      }
    }
    if (validateType(value, RemoteSchema)) {
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
      mutateAndGetPayload: async function (args:any, context:any, info:graphql.GraphQLResolveInfo, sgContext) {
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
