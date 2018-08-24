// @flow
import {isOutputType, GraphQLNonNull, GraphQLSchema, GraphQLObjectType, GraphQLList} from 'graphql'
import _ from 'lodash'
import {
  mergeSchemas
} from 'graphql-tools'
import type {GraphQLField, GraphQLNamedType} from 'graphql'
import type {IResolversParameter} from 'graphql-tools'
import {
  SchemaVisitor,
  visitSchema,
  healSchema
} from 'graphql-tools/dist/schemaVisitor'
import type{VisitableSchemaType} from 'graphql-tools/dist/schemaVisitor'
import invariant from '../utils/invariant'

class SchemaRemoteVisitor extends SchemaVisitor {
  static visitTheSchema (schema: GraphQLSchema,
                        context: {
                          [key: string]: any
                        } = Object.create(null)): GraphQLSchema {
    function visitorSelector (type: VisitableSchemaType,
                             methodName: string): Array<SchemaRemoteVisitor> {
      const visitors = []
      if (methodName !== 'visitFieldDefinition') { return visitors }

      const isStub = (type:VisitableSchemaType) => {
        return (type instanceof GraphQLObjectType) &&
          type.name.startsWith(context.prefix) &&
          !_.isEmpty(type.description) &&
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
            console.log(`visitorSelector got it:${visitedType.name},${remoteType.name},${methodName}:`, remoteType.description)
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

  constructor (config: {
    name: string,
    args: {[name: string]: any},
    visitedType: VisitableSchemaType,
    schema: GraphQLSchema,
    context: {[key: string]: any}
  }) {
    super()
    this.name = config.name
    this.args = config.args
    this.visitedType = config.visitedType
    this.schema = config.schema
    this.context = config.context
  }
}

class RemoteDirective extends SchemaRemoteVisitor {
  visitFieldDefinition (field: GraphQLField<any, any>) {
    invariant(!_.isEmpty(this.args), 'Must provide args')
    const getTargetSchema = (modeName: string, srcSchemas: Array<GraphQLSchema>): ?GraphQLNamedType => {
      if (_.isEmpty(srcSchemas)) { return }

      for (let i = 0; i < srcSchemas.length; ++i) {
        const target = srcSchemas[i]
        if (target && target.getType(modeName)) {
          return target.getType(modeName)
        }
      }
    }

    const schemas = [...this.context.srcSchema, this.schema]
    const gqlObj = getTargetSchema(this.args.target, schemas)
    invariant(isOutputType(gqlObj), `invalid remote link ${field.name} => ${this.args.target}: not output type(maybe null)`)

    if (gqlObj) {
      if (field.type instanceof GraphQLList) {
        field.type = new GraphQLList(gqlObj)
      } else {
        field.type = gqlObj
      }
    }
  }
}

function mergeAllSchemas (schema: GraphQLSchema, schemaMerged: Array<GraphQLSchema>, resolvers: IResolversParameter, prefix: string): GraphQLSchema {
  if (_.isEmpty(schemaMerged) && (_.isEmpty(resolvers) || (_.isEmpty(resolvers.Query) && _.isEmpty(resolvers.Mutation)))) { return schema }

  SchemaRemoteVisitor.visitTheSchema(schema, {
    prefix,
    srcSchema: schemaMerged
  })
  return mergeSchemas({schemas: [schema, ...schemaMerged], resolvers})
}

module.exports = {
  mergeAllSchemas
}
