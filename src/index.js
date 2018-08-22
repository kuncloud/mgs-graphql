// @flow

import Sequelize from 'sequelize'
import _ from 'lodash'
import {GraphQLSchema, GraphQLObjectType, GraphQLNonNull, GraphQLID} from 'graphql'
import type {GraphQLFieldConfig} from 'graphql'
import * as relay from 'graphql-relay'
// import invariant from './utils/invariant'
import Schema from './definition/Schema'
import Service from './definition/Service'
import Type from './type'
import Context from './Context'
import StringHelper from './utils/StringHelper'
import Connection from './utils/Connection'
import Transformer from './transformer'
import RemoteSchema from './definition/RemoteSchema'
import type {SchemaOptionConfig, BuildOptionConfig} from './Definition'
import {mergeAllSchemas} from './transformer/schemaVistor'
import type {RemoteConfig} from './utils/remote'

const SimpleGraphQL = {

  /** Available values:
   * <table style='text-align: left'>
   *   <tr><th>Name</th><th>GraphQL Type</th><th>DB Type</th></tr>
   *   <tr><td>Id</td><td>GraphQLID</td><td>Sequelize.INTEGER</td></tr>
   *   <tr><td>String</td><td>GraphQLString</td><td>Sequelize.STRING</td></tr>
   *   <tr><td>Float</td><td>GraphQLFloat</td><td>Sequelize.DOUBLE</td></tr>
   *   <tr><td>Int</td><td>GraphQLInt</td><td>Sequelize.INTEGER</td></tr>
   *   <tr><td>Boolean</td><td>GraphQLBoolean</td><td>Sequelize.BOOLEAN</td></tr>
   *   <tr><td>Date</td><td>GraphQLScalarTypes.Date</td><td>Sequelize.DATE</td></tr>
   *   <tr><td>JSON</td><td>GraphQLScalarTypes.Json</td><td>Sequelize.JSONB</td></tr>
   * </table>
   *
   */
  ScalarFieldTypes: Type.ScalarFieldTypes,

  Schema: Schema,

  Connection: Connection,

  Service: Service,

  // RemoteLinkConfig: RemoteLinkConfig,

  /**
   * Define a Schema
   *
   * @param name
   * @param options
   */
  schema: <T>(name: string, options: SchemaOptionConfig = {}): Schema<T> => new Schema(name, options),

  service: <T>(name: string): Service<T> => new Service(name),

  remoteSchema: (name: string): RemoteSchema => new RemoteSchema(name),

  /**
   * Build the GraphQL Schema
   */
  build: (args: {
    sequelize:Sequelize,
    schemas?:Array<Schema<any>>,
    services?:Array<Service<any>>,
    options?:BuildOptionConfig,
    remoteCfg?:RemoteConfig
  }): {graphQLSchema:GraphQLSchema, sgContext:any} => {
    const {sequelize, schemas = [], services = [], options = {}, remoteCfg = {}} = args
    const context = new Context(sequelize, options, remoteCfg)

    // 添加Schema
    schemas.forEach(schema => {
      context.addSchema(schema)
    })

    // 添加Service
    services.forEach(service => {
      context.addService(service)
    })

    context.buildModelAssociations()

    const finalQueries: {[fieldName: string]: GraphQLFieldConfig<any, any>} = {}

    _.forOwn(context.queries, (value, key) => {
      const fieldConfig = Transformer.toGraphQLFieldConfig(
        key,
        'Payload',
        value.$type,
        context)

      finalQueries[key] = {
        type: fieldConfig.type,
        resolve: context.wrapQueryResolve(value),
        description: value.description
      }
      if (value.args || fieldConfig.args) {
        finalQueries[key].args = Transformer.toGraphQLInputFieldMap(
          StringHelper.toInitialUpperCase(key), {
            ...fieldConfig.args,
            ...value.args
          })
      }
    })

    const viewerConfig = _.get(options, 'query.viewer', 'AllQuery')
    if (viewerConfig === 'AllQuery') {
      context.graphQLObjectTypes['Viewer'] = new GraphQLObjectType({
        name: 'Viewer',
        interfaces: [context.nodeInterface],
        fields: () => {
          const fields = {
            id: {type: new GraphQLNonNull(GraphQLID)}
          }
          _.forOwn(finalQueries, (value, key) => {
            if (key !== 'viewer' && key !== 'relay') fields[key] = value
          })
          // if(!_.isEmpty(schemaMerged)){
          //   for(let i=0;i<schemaMerged.length;++i){
          //     const one = schemaMerged[i].getQueryType()
          //     _.forOwn(one._typeConfig.fields, (value, key) => {
          //       if (key !== 'viewer' && key !== 'relay') fields[key] = value
          //     })
          //   }
          // }

          return fields
        }
      })

      finalQueries['viewer'] = {
        description: 'Default Viewer implement to include all queries.',
        type: new GraphQLNonNull(((context.graphQLObjectTypes['Viewer']:any):GraphQLObjectType)),
        resolve: () => {
          return {
            _type: 'Viewer',
            id: relay.toGlobalId('Viewer', 'viewer')
          }
        }
      }
    } else if (viewerConfig === 'FromModelQuery') {
      if (!finalQueries['viewer']) {
        throw new Error('Build option has config "query.view=FromModelQuery" but query "viewer" not defined.')
      }
      // TODO check whether viewer.type is a Node
    } else if (typeof viewerConfig === 'object') {
      const fieldConfig = Transformer.toGraphQLFieldConfig(
        'viewer',
        'Payload',
        viewerConfig.$type,
        context)
      finalQueries['viewer'] = {
        type: fieldConfig.type,
        resolve: context.wrapQueryResolve(viewerConfig),
        description: viewerConfig.description
      }
    }

    finalQueries['node'] = {
      name: 'node',
      description: 'Fetches an object given its ID',
      type: context.nodeInterface,
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLID),
          description: 'The ID of an object'
        }
      },
      resolve: context.wrapQueryResolve({
        name: 'node',
        $type: context.nodeInterface,
        resolve: async function (args, context, info, sgContext, invoker) {
          const id = relay.fromGlobalId(args.id)
          if (id.type === 'Viewer') {
            if (finalQueries['viewer'] && finalQueries['viewer'].resolve) {
              return finalQueries['viewer'].resolve(null, args, context, info)
            }
          }
          if (!sgContext.models[id.type]) return null
          const record = await sgContext.models[id.type].findOne({where: {id: id.id}})
          if (record) {
            record._type = id.type
          }
          return record
        }
      })
    }

    const rootQuery = new GraphQLObjectType({
      name: 'Query',
      fields: () => {
        return finalQueries
      }
    })

    finalQueries['relay'] = {
      description: 'Hack to workaround https://github.com/facebook/relay/issues/112 re-exposing the root query object',
      type: new GraphQLNonNull(rootQuery),
      resolve: () => {
        return {}
      }
    }

    const rootMutation = new GraphQLObjectType({
      name: 'Mutation',
      fields: () => {
        const fields: {[fieldName: string]: GraphQLFieldConfig<any, any>} = {}
        _.forOwn(context.mutations, (value, key) => {
          const inputFields = Transformer.toGraphQLInputFieldMap(StringHelper.toInitialUpperCase(key), value.inputFields)
          const outputFields = {}
          const payloadFields = _.get(options, 'mutation.payloadFields', [])
          for (const field of payloadFields) {
            console.log('mutation:', field)
            if (typeof field === 'string') {
              if (!finalQueries[field]) {
                throw new Error('Incorrect buildOption. Query[' + field + '] not exist.')
              }
              outputFields[field] = finalQueries[field]
            } else {
              outputFields[field.name] = field
            }
          }
          _.forOwn(value.outputFields, (fValue, fKey) => {
            outputFields[fKey] = Transformer.toGraphQLFieldConfig(
              key + '.' + fKey,
              'Payload',
              fValue,
              context)
          })
          if (!value['name']) {
            value['name'] = key
          }
          fields[key] = Transformer.mutationWithClientMutationId({
            name: StringHelper.toInitialUpperCase(key),
            inputFields: inputFields,
            outputFields: outputFields,
            mutateAndGetPayload: context.wrapMutateAndGetPayload(value),
            description: value.doc
          })
        })
        return fields
      }
    })

    let schema = new GraphQLSchema({
      query: rootQuery,
      mutation: rootMutation
    })

    const schemaMerged = []
    if (!_.isEmpty(context.remoteInfo) && !_.isEmpty(context.remoteInfo['schema'])) {
      _.forOwn(context.remoteInfo['schema'], (value, key) => {
        schemaMerged.push(value)
      })
    }

    schema = mergeAllSchemas(
      schema,
      schemaMerged,
      context.resolvers,
      context.remotePrefix
    )

    return {
      sgContext: context.getSGContext(),
      graphQLSchema: schema
    }
  }
}

export default SimpleGraphQL
