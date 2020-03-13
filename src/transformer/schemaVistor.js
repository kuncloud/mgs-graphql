// @flow
const {
  isOutputType,
  GraphQLNonNull,
  GraphQLUnionType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLList
} = require('graphql')
const _ = require('lodash')
const {
  mergeSchemas
} = require('graphql-tools')
const {
  SchemaVisitor,
  visitSchema,
  healSchema
} = require('graphql-tools/dist/schemaVisitor')
const invariant = require('../utils/invariant')
const helper = require('../utils/helper')

let otherTypes = {}

class SchemaRemoteVisitor extends SchemaVisitor {
  static visitTheSchema (schema, context = Object.create(null)) {
    function visitorSelector (type, methodName) {
      const visitors = []
      if (methodName !== 'visitFieldDefinition') {
        return visitors
      }

      const isStub = (type) => {
        return (type instanceof GraphQLObjectType) &&
          type.name.startsWith(context.prefix) && !_.isEmpty(type.description) &&
          type.description.startsWith('{') &&
          type.description.endsWith('}')
      }
      let remoteType = null
      let visitedType = null
      if (type.type instanceof GraphQLList) {
        const element = type.type.ofType
        if (isStub(element)) {
          visitedType = type
          remoteType = element
        }
      } else if (type.type instanceof GraphQLNonNull) {
        if (isStub(type.type.ofType)) {
          visitedType = type
          remoteType = type.type.ofType
        }
      } else if (isStub(type.type)) {
        visitedType = type
        remoteType = type.type
      }

      if (remoteType != null && visitedType != null) {
        try {
          const info = JSON.parse(remoteType.description)
          if (!_.isEmpty(info)) {
            // console.log(`visitorSelector got it:${visitedType.name},${remoteType.name},${methodName}:`, remoteType.description)
            visitors.push(new RemoteDirective({
              name: 'remote',
              args: {...info},
              visitedType: visitedType,
              schema,
              context
            }))
            return visitors
          }
        } catch (err) {
          console.warn('visitorSelector:', err)
        }
      }

      return visitors
    }

    visitSchema(schema, visitorSelector)

    healSchema(schema)

    return schema
  }

  constructor (config) {
    super()
    this.name = config.name
    this.args = config.args
    this.visitedType = config.visitedType
    this.schema = config.schema
    this.context = config.context
  }
}

class RemoteDirective extends SchemaRemoteVisitor {
  visitFieldDefinition (field) {
    invariant(!_.isEmpty(this.args), 'Must provide args')

    const getTargetSchema = (modeName, srcSchemas) => {
      if (_.isEmpty(srcSchemas)) {
        return
      }

      let found = null
      _.forOwn(srcSchemas, (value, key) => {
        if (!value) { return }
        let type = value.getType(modeName)
        if (type) {
          if (found && found.obj) {
            if (helper.calcRemoteLevels(found.obj.description) > helper.calcRemoteLevels(type.description)) {
              found = {
                obj: type,
                schemaName: key
              }
            }
          } else {
            found = {
              obj: type,
              schemaName: key
            }
          }
        }
      })

      return found
    }

    const addMergedObject = (schemaName, obj) => {
      if (obj instanceof GraphQLList) {
        addMergedObject(schemaName, obj.ofType)
      } else if (obj instanceof GraphQLNonNull) {
        addMergedObject(schemaName, obj.ofType)
      } else if (obj instanceof GraphQLObjectType || obj instanceof GraphQLInterfaceType) {
        if (!otherTypes[schemaName][obj.name]) {
          // console.log('addObj1:',schemaName,obj.name,obj.description)
          // invariant(!obj.description || !obj.description.startsWith('__'),
          //   `graph object ${obj.name} in ${schemaName}'s description invalid:${obj.description ? obj.description : ''}`)
          otherTypes[schemaName][obj.name] = obj
          obj.description = '__' + (obj.description ? obj.description : '')
          const fields = obj.getFields()
          _.forOwn(fields, (value, key) => {
            const args = value.args
            for (let i = 0; i < args.length; ++i) {
              addMergedObject(schemaName, args[i].type)
            }
            addMergedObject(schemaName, value.type)
          })
        }
      } else if (obj instanceof GraphQLUnionType) {
        const types = obj.getTypes()
        for (let i = 0; i < types.length; ++i) {
          addMergedObject(schemaName, types[i])
        }
      } else {
        if (!otherTypes[schemaName][obj.name]) {
          // console.log('addObj2:',schemaName,obj.name,obj.description)
          // invariant(!obj.description || !obj.description.startsWith('__'),
          //   `graph object ${obj.name} in ${schemaName}'s description invalid:${obj.description ? obj.description : ''}`)
          otherTypes[schemaName][obj.name] = obj
          obj.description = '__' + (obj.description ? obj.description : '')
        }
      }
    }

    const gqlObj = getTargetSchema(this.args.target, this.context.srcSchema)
    invariant(!gqlObj || isOutputType(gqlObj.obj), `invalid remote link ${field.name} => ${this.args.target}: not output type(maybe null)`)
    if (gqlObj && gqlObj.obj) {
      // console.log('match:',gqlObj.schemaName,gqlObj.obj.name)
      addMergedObject(gqlObj.schemaName, gqlObj.obj)

      invariant(otherTypes[gqlObj.schemaName][gqlObj.obj.name] === gqlObj.obj, `Must same output graphql object:${gqlObj.obj.name}`)

      if (field.type instanceof GraphQLList) {
        field.type = new GraphQLList(gqlObj.obj)
      } else {
        field.type = gqlObj.obj
      }
    }
  }
}

function mergeAllSchemas (schema, schemaMerged, resolvers, prefix) {
  if (_.isEmpty(schemaMerged)) {
    return schema
  }
  otherTypes = _.mapValues(schemaMerged, (value) => {
    return {}
  })

  SchemaRemoteVisitor.visitTheSchema(schema, {
    prefix,
    srcSchema: schemaMerged
  })

  // update by yy on 2009/1/31, 因为只作为API调用，不引用Schema时，是找不到有关联scehma的。
  // _.forOwn(otherTypes, (value, key) => {
  //   if (_.isEmpty(value)) {
  //     throw new Warn(`merged schema ${key}:none of schema is merging`)
  //   }
  // })

  let objMap = {}
  _.forOwn(otherTypes, (objs, schemaName) => {
    _.forOwn(objs, (obj, name) => {
      objMap[name] = obj
    })
  })

  return mergeSchemas({schemas: [schema, (_.map(objMap, (value) => value))], resolvers})
}

module.exports = {
  mergeAllSchemas
}
