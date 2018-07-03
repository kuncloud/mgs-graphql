// @flow

import Sequelize from 'sequelize'
import _ from 'lodash'

import * as graphql from 'graphql'
import * as relay from 'graphql-relay'
import {mergeSchemas} from 'graphql-tools'
import type {IResolversParameter}  from 'graphql-tools'

import invariant from './utils/invariant'
import Schema from './definition/Schema'
import Service from './definition/Service'
import Type from './type'
import Context from './Context'
import StringHelper from './utils/StringHelper'
import Connection from './utils/Connection'
import Transformer from './transformer'
import RemoteSchema from './definition/RemoteSchema'
import type {SchemaOptionConfig, BuildOptionConfig,RemoteLinkConfig} from './Definition'

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

  //RemoteLinkConfig: RemoteLinkConfig,

  /**
   * Define a Schema
   *
   * @param name
   * @param options
   */
  schema: <T>(name:string, options:SchemaOptionConfig={}):Schema<T> => new Schema(name, options),

  service: <T>(name:string):Service<T> => new Service(name),

  remoteSchema: (name:string):RemoteSchema => new RemoteSchema(name),
  /**
   * Build the GraphQL Schema
   */
  build: (args:{
         sequelize:Sequelize,
         schemas?:Array<Schema<any>>,
         services?:Array<Service<any>>,
         options?:BuildOptionConfig,
         mergeInfo?:{
           schemaMerged:graphql.GraphQLSchema,
           linkInfo?:{
             [id:string]: RemoteLinkConfig
           }
         }
         }):{graphQLSchema:graphql.GraphQLSchema, sgContext:any} => {
    const {sequelize, schemas = [], services = [], options = {}, mergeInfo = {}} = args
    const context = new Context(sequelize, options)

    // 添加Schema
    schemas.forEach(schema => {
      context.addSchema(schema)
    })

    // 添加Schema
    services.forEach(service => {
      context.addService(service)
    })

    context.buildModelAssociations()

    const finalQueries:{[fieldName: string]: graphql.GraphQLFieldConfig<any, any>} = {}

    _.forOwn(context.queries, (value, key) => {
      console.log('begin build query', key, value)
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
      console.log('build result', key, finalQueries[key])
    })

    const viewerConfig = _.get(options, 'query.viewer', 'AllQuery')
    if (viewerConfig === 'AllQuery') {
      console.log('begin build AllQuery')
      context.graphQLObjectTypes['Viewer'] = new graphql.GraphQLObjectType({
        name: 'Viewer',
        interfaces: [context.nodeInterface],
        fields: () => {
          const fields = {
            id: {type: new graphql.GraphQLNonNull(graphql.GraphQLID)}
          }
          _.forOwn(finalQueries, (value, key) => {
            if (key !== 'viewer' && key !== 'relay') fields[key] = value
          })
          return fields
        }
      })

      finalQueries['viewer'] = {
        description: 'Default Viewer implement to include all queries.',
        type: new graphql.GraphQLNonNull(((context.graphQLObjectTypes['Viewer']:any):graphql.GraphQLObjectType)),
        resolve: () => {
          return {
            _type: 'Viewer',
            id: relay.toGlobalId('Viewer', 'viewer')
          }
        }
      }
      console.log('build result', finalQueries['viewer'])
    } else if (viewerConfig === 'FromModelQuery') {
      if (!finalQueries['viewer']) {
        throw new Error('Build option has config "query.view=FromModelQuery" but query "viewer" not defined.')
      }
      // TODO check whether viewer.type is a Node
    } else {
      console.log('begin build other query')
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
      console.log('build result', finalQueries['viewer'])
    }

    finalQueries['node'] = {
      name: 'node',
      description: 'Fetches an object given its ID',
      type: context.nodeInterface,
      args: {
        id: {
          type: new graphql.GraphQLNonNull(graphql.GraphQLID),
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
    console.log('build result', finalQueries['node'])

    const rootQuery = new graphql.GraphQLObjectType({
      name: 'Query',
      fields: () => {
        return finalQueries
      }
    })

    finalQueries['relay'] = {
      description: 'Hack to workaround https://github.com/facebook/relay/issues/112 re-exposing the root query object',
      type: new graphql.GraphQLNonNull(rootQuery),
      resolve: () => {
        return {}
      }
    }

    const rootMutation = new graphql.GraphQLObjectType({
      name: 'Mutation',
      fields: () => {
        const fields:{[fieldName: string]: graphql.GraphQLFieldConfig<any, any>} = {}
        _.forOwn(context.mutations, (value, key) => {
          console.log('begin build mutation:', key, value)
          const inputFields = Transformer.toGraphQLInputFieldMap(StringHelper.toInitialUpperCase(key), value.inputFields)
          const outputFields = {}
          const payloadFields = _.get(options, 'mutation.payloadFields', [])
          for (let field of payloadFields) {
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
            console.log('begin build mutation outputfiled:', fKey, fValue)
            outputFields[fKey] = Transformer.toGraphQLFieldConfig(
              key + '.' + fKey,
              'Payload',
              fValue,
              context)
            console.log('mutation outputfiled result:', outputFields[fKey])
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
          console.log('mutation result:', fields[key])
        })
        return fields
      }
    })

    let schema = new graphql.GraphQLSchema({
      query: rootQuery,
      mutation: rootMutation
    })

    if(!_.isEmpty(mergeInfo) && mergeInfo.schemaMerged ){
      if(mergeInfo.linkInfo){
        const buildLinkInfos=(linkInfos: {[id:string]: RemoteLinkConfig}): {
          gqls:?Array<string>,
          resolvers:?IResolversParameter
        } => {
          if (_.isEmpty(linkInfos)) {
            return {
              gqls: [],
              resolvers: {}
            }
          }


          let queryDefs: string = ''
          let mutationDefs: string = ''
          let resolvers: IResolversParameter = {
            Query: {},
            Mutation: {}
          }
          let gqls: Array<string> = []


          _.forOwn(linkInfos, (ext, schemaName) => {
            if (ext.fields) {
              let typeDef: string = ''
              _.forOwn(ext.fields, (field, fieldName) => {
                invariant(
                  field.def && typeof field.def === 'string' ,
                  'Must provide field definition'
                )
                typeDef += `${fieldName}${field.def}\n`
                if(!resolvers[schemaName])
                  resolvers[schemaName] = {}
                resolvers[schemaName][fieldName] = async(root, args, context, info) => {
                  return field.resolve(args, context, info, context.getSGContext())
                }
              })

              if (!_.isEmpty(typeDef)) {
                gqls.push(`extend type ${schemaName}{
                  ${typeDef}
        }`)
              }
            }

            if(ext.queries){
              _.forOwn(ext.queries, (value, key) => {
                queryDefs += `${key}${value.def}\n`
                resolvers.Query[key] = async(root, args, context, info) => {
                  return value.resolve(args, context, info, context.getSGContext())
                }
              })
            }

            if(ext.mutations){
              _.forOwn(ext.mutations, (value, key) => {
                mutationDefs += `${key}${value.def}\n`
                resolvers.Mutation[key] = async(root, args, context, info) => {
                  return value.resolve(args, context, info, context.getSGContext())
                }
              })
            }
          })


          if (queryDefs && queryDefs.length) {
            gqls.push(`extend type Query {
      ${queryDefs}}`
            )
          }

          if (mutationDefs && mutationDefs.length) {
            gqls.push(`extend type Mutation {
      ${mutationDefs}}`
            )
          }

          console.log('defs:', gqls)
          console.log('resolver', resolvers)

          return {
            gqls,
            resolvers
          }
        }

        const {gqls, resolvers} = buildLinkInfos(mergeInfo.linkInfo)
        let schemas = [schema, mergeInfo.schemaMerged]
        if (gqls) {
          let gql = gqls.join(`\n`)
          if (!_.isEmpty(gql)) {
            schemas.push(gql)
          }
        }

        console.log('gqls:', gqls)
        schema = mergeSchemas({
          schemas,
          resolvers
        })
      }else{
        schema = mergeSchemas({
          schemas
        })
      }
    }


    return {
      sgContext: context.getSGContext(),
      graphQLSchema: schema
    }
  }
}

export default SimpleGraphQL
