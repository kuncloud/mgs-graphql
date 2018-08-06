// @flow
import {HttpLink} from 'apollo-link-http'
import {introspectSchema, makeRemoteExecutableSchema} from 'graphql-tools'
import fetch from 'node-fetch'
import path from 'path'
import fs from 'fs'
import {Binding} from 'graphql-binding'
import {toGlobalId, fromGlobalId} from 'graphql-relay'
import _ from 'lodash'

const protocol = 'http'

async function remoteSchemasFromURI(endPoint: String) {
  console.log('remoteSchemasFromURI call:', endPoint)
  const link    = new HttpLink({uri: endPoint, fetch})
  const rSchema = await introspectSchema(link)
  const schema  = makeRemoteExecutableSchema({
    schema: rSchema,
    link: link
  })

  return schema
}

function remoteSchemasFromFile(endPoint: String, gqlFile: String) {
  console.log('remoteSchemasFromFile call:', endPoint,gqlFile)

  const gql    = fs.readFileSync(path.resolve(__dirname,gqlFile),{flag:'r+',encoding:'utf-8'})
  console.log(gql)
  const link   = new HttpLink({uri: endPoint, fetch})
  const schema = makeRemoteExecutableSchema({
    schema: gql,
    link:   link
  })
  return schema
}

function endPoint({host, port, path}) {
  return `${protocol}://${host}:${port}/${path}`
}


class MyBinding extends Binding {
  constructor(schema) {
    super({
      schema: schema
    })
  }
}

function buildBindings(cfg) {
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
    console.log('binding cfg:',key,value)
    binding[key] = new MyBinding(remoteSchemasFromFile(endPoint(value.uri),value.gql.path))
  })

  return binding
}





module.exports = {
  buildBindings,
  endPoint,
  remoteSchemasFromURI,
  remoteSchemasFromFile
}
