// @flow
const {HttpLink} = require('apollo-link-http')
const {setContext} = require('apollo-link-context')
const {makeRemoteExecutableSchema} = require('graphql-tools')
const fetch = require('node-fetch')
const path = require('path')
const fs = require('fs')
const fsHelper = require('./fileHelper')
const {Binding} = require('graphql-binding')
const _ = require('lodash')

const protocol = 'http'

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

function remoteSchemasFromFile (endPoint, gqlFile, headerKeys = []) {
  // console.log('remoteSchemasFromFile call:', endPoint, gqlFile, __dirname)
  if (!gqlFile.endsWith('.gql')) { throw new Error('Must postfix with .gql') }

  if (!fsHelper.isFile(gqlFile)) {
    gqlFile = path.resolve(__dirname, gqlFile)
    console.warn('gql file add current path ', gqlFile)
  }

  const gql = fs.readFileSync(gqlFile, {flag: 'r+', encoding: 'utf-8'})
  // console.log(gql)
  const link = new HttpLink({uri: endPoint, fetch})
  const withToken = setContext(
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

  const schema = makeRemoteExecutableSchema({
    schema: gql,
    link: withToken.concat(link)
  })
  // assertValidSchema(schema)
  return schema
}

function endPoint ({host, port, path}) {
  return `${protocol}://${host}:${port}/${path}`
}

class MyBinding extends Binding {
  constructor (schema) {
    super({
      schema: schema
    })
  }
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
exports.buildBindings = function buildBindings (cfg, ext) {
  if (_.isEmpty(cfg)) { return {} }

  const binding = {}
  const headerKeys = _.get(ext, 'headerKeys', [])

  _.forOwn(cfg, (value, key) => {
    if (key.startsWith('__')) { return true }

    // console.log('binding cfg:',key,value)
    const schema = remoteSchemasFromFile(endPoint(value.uri), value.gql.path, headerKeys)
    // const schema = await remoteSchemasFromURI(endPoint(value.uri))

    if (!binding['schema']) {
      binding['schema'] = {}
    }
    binding['schema'][key] = schema

    // binding['schema'] = {
    //   ...binding['schema'],
    //   [key]: schema
    // }

    const b = new MyBinding(schema)
    _.forOwn(b.mutation, (resolve, field) => {
      b.mutation[field] = (args, context, info) => {
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

    if (!binding['binding']) {
      binding['binding'] = {}
    }

    binding['binding'][key] = b

    // binding['binding'] = {
    //   ...binding['binding'],
    //   [key]: b
    // }
  })

  return binding
}

// module.exports = {
//   buildBindings,
//   endPoint,
//   remoteSchemasFromURI,
//   remoteSchemasFromFile
// }
