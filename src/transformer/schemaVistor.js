// @flow
import {isOutputType, GraphQLSchema, GraphQLObjectType} from 'graphql'
import _ from 'lodash'
import {
  mergeSchemas,
} from 'graphql-tools';
import type {GraphQLFieldConfig, GraphQLField} from 'graphql'
import type {IResolversParameter} from 'graphql-tools'
import {
  SchemaVisitor,
  visitSchema,
  healSchema
} from 'graphql-tools/dist/schemaVisitor'
import type{VisitableSchemaType} from 'graphql-tools/dist/schemaVisitor'
import invariant from '../utils/invariant'
// import instanceOf from '../utils/instanceOf'

class SchemaRemoteVisitor extends SchemaVisitor {

  static visitTheSchema(schema: GraphQLSchema,
                        context: {
                          [key: string]: any
                        } = Object.create(null),): GraphQLSchema {
    function visitorSelector(type: VisitableSchemaType,
                             methodName: string,): Array<SchemaRemoteVisitor> {

      const visitors = []
      if (methodName != 'visitFieldDefinition')
        return visitors

      // console.log(`visitorSelector :${type.name}:`)
      if ((type.type instanceof GraphQLObjectType)
        && type.type.name.startsWith(context.prefix)
        && !_.isEmpty(type.type.description)
        && type.type.description.startsWith('{')
        && type.type.description.endsWith('}')) {
        try {
          const info = JSON.parse(type.type.description)
          if (!_.isEmpty(info)) {
            console.log(`visitorSelector got it:${type.name},${type.type.name},${methodName}:`, type.type.description)
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

    healSchema(schema)

    return schema
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
    // console.log('visit field:', field.name, this.visitedType.name)

    invariant(!_.isEmpty(this.args), 'Must provide args')
    const getTargetSchema = (modeName: string, srcSchemas: Array<GraphQLSchema>): GraphQLObjectType => {
      if (_.isEmpty(srcSchemas))
        return

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
      field.type = gqlObj
      if (field.name === 'test3') {
        // console.log('visit field:',field)
      }
      //console.log('visit field:',field.resolve)
    }
  }
}


function mergeAllSchemas(schema: GraphQLSchema, schemaMerged: Array<GraphQLSchema>, resolvers: IResolversParameter, prefix: string): GraphQLSchema {
  SchemaRemoteVisitor.visitTheSchema(schema, {
    prefix,
    srcSchema: schemaMerged
  })
  let all = mergeSchemas({schemas: [schema, ...schemaMerged], resolvers})
  // console.log('dd', schema.getQueryType().getFields()['test3'].type.name)
  // console.log('dd', all.getQueryType().getFields()['test3'].type.name)
  return all
}

module.exports = {
  mergeAllSchemas
}