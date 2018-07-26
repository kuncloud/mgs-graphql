// @flow
import _ from 'lodash'
import invariant from '../../utils/invariant'
import Schema from '../../definition/Schema'
import RemoteSchema from '../../definition/RemoteSchema'
// import StringHelper from '../../utils/StringHelper'

import resolveConnection from '../resolveConnection'

export default function hasManyLinkedField (schema:Schema<any>, options:any):void {
  // const name = StringHelper.toInitialLowerCase(schema.name)
  // Conver model association to field config
  _.forOwn(schema.config.associations.hasMany, (config, key) => {
    if (config.hidden) {
      return
    }

    invariant(!(config.target instanceof RemoteSchema),'unsupported remote schema as has many target:${schema.name}:${key},coming soon')
    const args:any = {}
    if (config.conditionFields) {
      args['condition'] = config.conditionFields
    }
    if (config.outputStructure === 'Array') {
      schema.links({
        [key]: {
          config: config.config,
          args:   args,
          $type:  [config.target],
          resolve: async function (root, args, context, info, sgContext) {
            let condition = config.scope || {}
            if (args && args.condition) {
              condition = {...condition, ...args.condition}
            }
            const sort  = config.sort || [{field: 'id', order: 'ASC'}]
            let sourceKey  = config.sourceKey || 'id'
            let foreignKey = config.foreignKey || (config.foreignField + 'Id')
            condition[foreignKey] = root[sourceKey]

            return sgContext.models[config.target].findAll({
              where: condition,
              order: sort.map(s => [s.field, s.order])
            })
          }
        }
      })
    } else {
      schema.links({
        [key]: {
          config: config.config,
          args: args,
          $type: config.target + 'Connection',
          resolve: async function (root, args, context, info, sgContext) {
            let condition = (args && args.condition) || {}
            if (config.scope) {
              condition = {...condition, ...config.scope}
            }
            const sort = config.sort || [{field: 'id', order: 'ASC'}]
            // if (models[hasManyCfg.target].options.underscored) {
            //  condition[StringHelper.toUnderscoredName(_.get(hasManyCfg, 'options.foreignKey', name + 'Id'))] = root.id
            //  for (let item of sort) {
            //    item.field = StringHelper.toUnderscoredName(item.field)
            //  }
            // } else {
            let sourceKey = config.sourceKey || 'id'
            let foreignKey = config.foreignKey || (config.foreignField + 'Id')
            condition[foreignKey] = root[sourceKey]

            // }
            return resolveConnection(sgContext.models[config.target], {...args, condition, sort})
          }
        }
      })
    }
  })
}
