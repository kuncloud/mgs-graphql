// @flow
import {HttpLink} from 'apollo-link-http'
import {setContext} from 'apollo-link-context'
import {GraphQLSchema} from 'graphql'
import type {GraphQLResolveInfo} from 'graphql'
import {makeRemoteExecutableSchema} from 'graphql-tools'
import fetch from 'node-fetch'
import path from 'path'
import fs from 'fs'
import * as fsHelper from './fileHelper'
import {Binding} from 'graphql-binding'
import _ from 'lodash'

const protocol: string = 'http'

// async function remoteSchemasFromURI(endPoint: String): GraphQLSchema {
//   console.log('remoteSchemasFromURI call:', endPoint)
//   const link = new HttpLink({uri: endPoint, fetch})
//   const rSchema = await introspectSchema(link)
//   const schema: GraphQLSchema  = makeRemoteExecutableSchema({
//     schema: rSchema,
//     link: link
//   })
//   // assertValidSchema(schema)
//   return schema
// }

function remoteSchemasFromFile (endPoint: string, gqlFile: string, headerKeys = []): GraphQLSchema {
  console.log('remoteSchemasFromFile call:', endPoint, gqlFile, __dirname)
  if (!gqlFile.endsWith('.gql')) { throw new Error('Must postfix with .gql') }

  if (!fsHelper.isFile(gqlFile)) {
    gqlFile = path.resolve(__dirname, gqlFile)
    console.warn('gql file add current path ', gqlFile)
  }

  const gql: string = fs.readFileSync(gqlFile, {flag: 'r+', encoding: 'utf-8'})
  // console.log(gql)
  const link: HttpLink = new HttpLink({uri: endPoint, fetch})
  const withToken: HttpLink = setContext(
    (req, {graphqlContext}) => {
      const headers = {}
      if (graphqlContext) {
        _.assign(headers, graphqlContext.headers)
        headerKeys.map(key => _.set(headers, key, _.get(graphqlContext.headers, key, '')))
      }
      return {
        headers
      }
    }
  )

  const schema: GraphQLSchema = makeRemoteExecutableSchema({
    schema: gql,
    link: withToken.concat(link)
  })
  // assertValidSchema(schema)
  return schema
}

function endPoint ({host, port, path}:{host:string, port:string, path:string}): string {
  return `${protocol}://${host}:${port}/${path}`
}

class MyBinding extends Binding {
  constructor (schema: GraphQLSchema) {
    super({
      schema: schema
    })
  }
}

export type RemoteConfig = {
  [key:string]:{
    uri:{
      host: string,
      port: string,
      path: string
    },
    gql?:{
      path: string
    }
  },
  // __proto__: null
}

// const EndPoints = {
//   common: {
//     uri: {
//       host: '127.0.0.1',
//       port: '4002',
//       path: 'graphql'
//     },
//     gql:{
//       path:'gql/common.gql'
//     }
//   }
// }
export function buildBindings (cfg: RemoteConfig, {headerKeys = []}): {[key:string]:any} {
  if (_.isEmpty(cfg)) { return {} }

  const binding = {

  }

  _.forOwn(cfg, (value, key) => {
    if (key.startsWith('__')) { return true }

    // console.log('binding cfg:',key,value)
    const schema = remoteSchemasFromFile(endPoint(value.uri), value.gql.path, headerKeys)
    // const schema = await remoteSchemasFromURI(endPoint(value.uri))
    binding['schema'] = {
      ...binding['schema'],
      [key]: schema
    }

    const b = new MyBinding(schema)
    _.forOwn(b.mutation, (resolve, field) => {
      b.mutation[field] = (args?: {
        [key: string]: any;
      }, context?: {
        [key: string]: any;
      }, info?: GraphQLResolveInfo | string) => {
        if (args) {
          if (args.input) {
            if (!args.input.clientMutationId) { args.input.clientMutationId = Date.now().toString() }
          } else {
            if (!args.clientMutationId) { args.clientMutationId = Date.now().toString() }
            console.warn(`Schema ${key} Mutation ${field} no input arguments`)
          }
        }

        return resolve(args, context, info)
      }
    })

    binding['binding'] = {
      ...binding['binding'],
      [key]: b
    }
  })

  return binding
}

// module.exports = {
//   buildBindings,
//   endPoint,
//   remoteSchemasFromURI,
//   remoteSchemasFromFile
// }
