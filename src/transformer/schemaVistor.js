// @flow
import {isOutputType, isObjectType} from 'graphql'
import _ from 'lodash'
import {
  mergeSchemas,
} from 'graphql-tools';
import type {GraphQLFieldConfig, GraphQLField} from 'graphql'
import type {IResolversParameter} from 'graphql-tools'
import {
  SchemaVisitor,
  visitSchema
} from 'graphql-tools/dist/schemaVisitor'
import invariant from '../utils/invariant'

class SchemaRemoteVisitor extends SchemaVisitor {

  static visitSchema(schema: GraphQLSchema,
                     context: {
                       [key: string]: any
                     } = Object.create(null),): void {
    function visitorSelector(type: VisitableSchemaType,
                             methodName: string,): SchemaDirectiveVisitor[] {

      const visitors = []
      if (methodName != 'visitFieldDefinition')
        return visitors


      if (isObjectType(type.type) && type.type.name.startsWith(context.prefix) && !_.isEmpty(type.type.description) && type.type.description.startsWith('{') && type.type.description.endsWith('}')) {
        try {
          const info = JSON.parse(type.type.description)
          if (!_.isEmpty(info)) {
            //console.log(`visitorSelector got it:${type.type.name},${methodName}:`, type.type.description)
            visitors.push(new RemoteDirective({
              name: 'remote',
              args: {...info},
              visitedType: type,
              schema,
              context
            }));
            return visitors
          }
        } catch (err) {
          console.warn('visitorSelector:', err)
        }
      }

      return visitors
    }

    visitSchema(schema, visitorSelector);
  }

  constructor(config: {
    name: string,
    args: {[name: string]: any},
    visitedType: VisitableSchemaType,
    schema: GraphQLSchema,
    context: {[key: string]: any}
  }) {
    super();
    this.name = config.name;
    this.args = config.args;
    this.visitedType = config.visitedType;
    this.schema = config.schema;
    this.context = config.context;
  }
}

class RemoteDirective extends SchemaRemoteVisitor {
  visitFieldDefinition(field: GraphQLField<any, any>) {
    console.log('visit field:', field.name)

    invariant(!_.isEmpty(this.args), 'Must provide args')

    const schema = this.context.srcSchema || this.schema
    const gqlObj = schema.getType(this.args.target)
    invariant(isOutputType(gqlObj), `invalid remote link ${field.name} => ${this.args.target}: not output type(maybe null)`)

    if (gqlObj) {
      const fieldName = field.name
      const linkId = fieldName + 'Id'

      field.type = gqlObj
    }
  }
}


export function mergeAllSchemas(schema:GraphQLSchema, schemaMerged:GraphQLSchema, resolvers:IResolversParameter, prefix:String):GraphQLSchema {
  if (_.isEmpty(schemaMerged)) {
    return _.isEmpty(resolvers) ? schema : mergeSchemas({schemas: [schema], resolvers})
  } else {
    let all = mergeSchemas({schemas: [schema,schemaMerged], resolvers})
    SchemaRemoteVisitor.visitSchema(all,{prefix})
    return all
  }

}
