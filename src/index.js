// @flow

import Sequelize from 'sequelize'
import _ from 'lodash'
import {GraphQLSchema, GraphQLObjectType, GraphQLNonNull, GraphQLID, isNamedType, getNamedType} from 'graphql'
import type {GraphQLFieldConfig} from 'graphql'
import * as relay from 'graphql-relay'
import {
  createResolveType,
  fieldToFieldConfig,
  recreateType,
  fieldMapToFieldConfigMap
} from 'graphql-tools/dist/stitching/schemaRecreation'
import invariant from './utils/invariant'
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

    const schemaMerged = []
    if (!_.isEmpty(context.remoteInfo) && !_.isEmpty(context.remoteInfo['schema'])) {
      _.forOwn(context.remoteInfo['schema'], (value, key) => {
        schemaMerged.push(value)
      })
    }

    const createNodeQuery = (NodeType, viewerResolve) => {
      return {
        name: 'node',
        description: 'Fetches an object given its ID',
        type: NodeType,
        args: {
          id: {
            type: new GraphQLNonNull(GraphQLID),
            description: 'The ID of an object'
          }
        },
        resolve: context.wrapQueryResolve({
          name: 'node',
          $type: NodeType,
          resolve: async function (args, context, info, sgContext, invoker) {
            const id = relay.fromGlobalId(args.id)
            if (id.type === 'Viewer') {
              // if (finalQueries['viewer'] && finalQueries['viewer'].resolve) {
              //   return finalQueries['viewer'].resolve(null, args, context, info)
              // }
              if (viewerResolve) {
                return viewerResolve(null, args, context, info)
              }
            }
            if (sgContext.models[id.type]) {
              const record = await sgContext.models[id.type].findOne({where: {id: id.id}})
              if (record) {
                record._type = id.type
              }
              return record
            } else {

              // TODO YY
              // const bindings = sgContext.bindings
              // let remoteFn
              // _.forOwn(bindings,(value)=>{
              //   if(!value.query)
              //     return
              //   remoteFn = value.query[StringHelper.toInitialLowerCase(id.type)]
              //   if(remoteFn && typeof remoteFn ===  'function') {
              //     console.log('iddidid',args.id)
              //     return false
              //   }
              // })
              //
              // if(remoteFn) {
              //   const res = await remoteFn({id: args.id})
              //   if(res)
              //     res._type = id.type
              //   return res
              //   // console.log('11',res,typeof id.type)
              //   // console.log('22',typeof relay.fromGlobalId(res.id).id)
              //   // if(res)
              //   //   return {id:relay.toGlobalId(id.type,relay.fromGlobalId(res.id).id)}
              //
              // }
            }

            return null
          }
        })
      }
    }

    if (_.isEmpty(schemaMerged)) {
      // console.log('create viewer without other schema')
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
      } else if (viewerConfig && viewerConfig.$type) {
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

      finalQueries['node'] = createNodeQuery(context.nodeInterface, finalQueries['viewer'] ? finalQueries['viewer'].resolve : null)
      // finalQueries['node'] = {
      //   name: 'node',
      //   description: 'Fetches an object given its ID',
      //   type: context.nodeInterface,
      //   args: {
      //     id: {
      //       type: new GraphQLNonNull(GraphQLID),
      //       description: 'The ID of an object'
      //     }
      //   },
      //   resolve: context.wrapQueryResolve({
      //     name: 'node',
      //     $type: context.nodeInterface,
      //     resolve: async function (args, context, info, sgContext, invoker) {
      //
      //       console.log('ffffffff22')
      //       const id = relay.fromGlobalId(args.id)
      //       if (id.type === 'Viewer') {
      //         if (finalQueries['viewer'] && finalQueries['viewer'].resolve) {
      //           return finalQueries['viewer'].resolve(null, args, context, info)
      //         }
      //       }
      //       if (!sgContext.models[id.type]) return null
      //       const record = await sgContext.models[id.type].findOne({where: {id: id.id}})
      //       if (record) {
      //         record._type = id.type
      //       }
      //       return record
      //     }
      //   })
      // }
    }

    const rootQuery = new GraphQLObjectType({
      name: 'Query',
      fields: () => {
        return finalQueries
      }
    })

    //
    // finalQueries['relay'] = {
    //   description: 'Hack to workaround https://github.com/facebook/relay/issues/112 re-exposing the root query object',
    //   type: new GraphQLNonNull(rootQuery),
    //   resolve: () => {
    //     return {}
    //   }
    // }

    const rootMutation = new GraphQLObjectType({
      name: 'Mutation',
      fields: () => {
        const fields: {[fieldName: string]: GraphQLFieldConfig<any, any>} = {}
        _.forOwn(context.mutations, (value, key) => {
          const inputFields = Transformer.toGraphQLInputFieldMap(StringHelper.toInitialUpperCase(key), value.inputFields)
          const outputFields = {}
          if (_.isEmpty(schemaMerged)) {
            const payloadFields = _.get(options, 'mutation.payloadFields', [])
            for (const field of payloadFields) {
              if (typeof field === 'string') {
                if (!finalQueries[field]) {
                  throw new Error('Incorrect buildOption. Query[' + field + '] not exist.')
                }
                outputFields[field] = finalQueries[field]
              } else {
                outputFields[field.name] = field
              }
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

    schema = mergeAllSchemas(
      schema,
      schemaMerged,
      context.resolvers,
      context.remotePrefix
    )

    if (!_.isEmpty(schemaMerged)) {
      const viewerConfig = _.get(options, 'query.viewer', 'AllQuery')
      if (viewerConfig === 'AllQuery') {
        const createAllQuery = (src, context) => {
          const queryType = src.getQueryType()
          const mutationType = src.getMutationType()
          const subscriptionType = src.getSubscriptionType()
          const typeMap = src.getTypeMap()

          // create resolve type function
          const types = {}
          const resolveType = createResolveType(name => {
            if (typeof types[name] === 'undefined') {
              throw new Error(`Can't find type ${name}.`)
            }
            return types[name]
          })

          // iterate typemap for named types
          Object.keys(typeMap).map((typeName) => {
            const type = typeMap[typeName]
            if (isNamedType(type) && getNamedType(type).name.slice(0, 2) !== '__' // && typeName !== queryType.name //&& typeName !== mutationType.name
            ) {
              types[typeName] = recreateType(type, resolveType, true)
            }
          })
          types['Node'] = context.nodeInterface

          // create 'Viewer' type
          const ViewerName = 'Viewer'
          const ViewerFieldsMap = fieldMapToFieldConfigMap(queryType.getFields(), resolveType, true)
          ViewerFieldsMap['id'] = {
            type: new GraphQLNonNull(GraphQLID)
          }

          const viewerGqlObj = new GraphQLObjectType({
            name: ViewerName,
            description: 'Default Viewer implement to include all queries.',
            fields: () => ViewerFieldsMap,
            interfaces: [types['Node']]
          })
          types[ViewerName] = viewerGqlObj

          // recreate  query field of root
          /// /add viewer to query
          const queryInterfaces = queryType.getInterfaces()
          const queryFields = queryType.getFields()
          const queryFieldsMap = fieldMapToFieldConfigMap(queryFields, resolveType, true)
          queryFieldsMap['viewer'] = {
            description: 'Default Viewer implement to include all queries.',
            type: new GraphQLNonNull(types[ViewerName]),
            resolve: () => {
              return {
                _type: 'Viewer',
                id: relay.toGlobalId('Viewer', 'viewer')
              }
            }
          }

          queryFieldsMap['node'] = createNodeQuery(types['Node'], queryFieldsMap['viewer'].resolve)
          const query = new GraphQLObjectType({
            name: queryType.name,
            description: queryType.description,
            fields: queryFieldsMap,
            interfaces: () => queryInterfaces.map(iface => resolveType(iface))
          })
          types[queryType.name] = query

          // recreate  mutation field of root
          if (mutationType) {
            const mutationFields = mutationType.getFields()
            const mutationFieldsMap = _.mapValues(mutationFields, (value) => {
              const mutationCfg = fieldToFieldConfig(value, resolveType, true)
              const mutationFields = mutationCfg.type.getFields()
              const fieldsMap = _.mapValues(mutationFields, (value) => {
                const cfg = fieldToFieldConfig(value, resolveType, true)
                return cfg
              })
              fieldsMap['viewer'] = {
                description: 'Default Viewer implement to include all queries.',
                type: new GraphQLNonNull(types[ViewerName]),
                resolve: () => {
                  return {
                    _type: 'Viewer',
                    id: relay.toGlobalId('Viewer', 'viewer')
                  }
                }
              }

              const interfaces = mutationCfg.type.getInterfaces()
              invariant(types[mutationCfg.type.name], 'duplicate mutation method?', mutationCfg.type.name)
              const type = new GraphQLObjectType({
                name: mutationCfg.type.name,
                description: mutationCfg.type.description,
                fields: fieldsMap,
                interfaces: () => interfaces.map(iface => resolveType(iface))
              })
              types[type.name] = type
              mutationCfg.type = type

              return mutationCfg
            })

            const mutationInterfaces = mutationType.getInterfaces()
            const mutation = new GraphQLObjectType({
              name: mutationType.name,
              description: mutationType.description,
              fields: mutationFieldsMap,
              interfaces: () => mutationInterfaces.map(iface => resolveType(iface))
            })
            types[mutation.name] = mutation
          }

          // generate new schema
          const theSchema = new GraphQLSchema({
            query: types[queryType.name],
            mutation: mutationType ? types[mutationType.name] : null,
            subscription: subscriptionType ? types[subscriptionType.name] : null,
            types: Object.keys(types).map(name => types[name])
          })

          return theSchema
        }
        schema = createAllQuery(schema, context)
      } else if (viewerConfig === 'FromModelQuery') {
        if (!finalQueries['viewer']) {
          throw new Error('Build option has config "query.view=FromModelQuery" but query "viewer" not defined.')
        }
        // TODO check whether viewer.type is a Node
      } else if (typeof viewerConfig === 'object') {
        throw new Error('multschema object viewer not supported')
      }
    }

    return {
      sgContext: context.getSGContext(),
      graphQLSchema: schema
    }
  }
}

export default SimpleGraphQL
