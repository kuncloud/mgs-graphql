// @flow
import {HttpLink} from 'apollo-link-http'
import {GraphQLSchema,GraphQLObjectType,assertValidSchema,GraphQLID,printSchema} from 'graphql'
import type {GraphQLFieldConfig} from 'graphql'
import {introspectSchema, makeRemoteExecutableSchema} from 'graphql-tools'
import fetch from 'node-fetch'
import path from 'path'
import fs from 'fs'
import {Binding} from 'graphql-binding'
import {toGlobalId, fromGlobalId} from 'graphql-relay'
import _ from 'lodash'

const protocol:string = 'http'



async function remoteSchemasFromURI(endPoint: String):GraphQLSchema {
  console.log('remoteSchemasFromURI call:', endPoint)
  const link    = new HttpLink({uri: endPoint, fetch})
  const rSchema = await introspectSchema(link)
  const schema  = makeRemoteExecutableSchema({
    schema: rSchema,
    link:   link
  })
  assertValidSchema(schema)
  return schema
}

function remoteSchemasFromFile(endPoint: string, gqlFile: string):GraphQLSchema {
  console.log('remoteSchemasFromFile call:', endPoint,gqlFile,__dirname)

  const gql:string    = fs.readFileSync(path.resolve(__dirname,gqlFile),{flag:'r+',encoding:'utf-8'})
  // console.log(gql)
  const link:HttpLink   = new HttpLink({uri: endPoint, fetch})
  const schema:GraphQLSchema = makeRemoteExecutableSchema({
    schema: gql,
    link:   link
  })
  assertValidSchema(schema)
  return schema
}

function endPoint({host, port, path}:{host:string,port:string,path:string}):string {
  return `${protocol}://${host}:${port}/${path}`
}


class MyBinding extends Binding {
  constructor(schema:GraphQLSchema) {
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
  __proto__: null
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
export  function buildBindings(cfg:RemoteConfig):{[key:string]:any} {
  if(_.isEmpty(cfg))
    return {}

  const binding = {
    toGId:  (type, id) => toGlobalId(type, id),
    toDbId: (type, id) => {
      const gid = fromGlobalId(id)
      if (gid.type !== type) {
        throw new Error(`错误的global id,type:${type},gid:${id}`)
      }
      return gid.id
    }
  }

  _.forOwn(cfg,(value, key) => {
    // console.log('binding cfg:',key,value)
    const schema = remoteSchemasFromFile(endPoint(value.uri),value.gql.path)
    // const schema = await remoteSchemasFromURI(endPoint(value.uri))
    binding['schema'] = {
      ...binding['schema'],
      [key]:schema
    }

    binding['binding'] = {
      ...binding['binding'],
      [key]:new MyBinding(schema)
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
