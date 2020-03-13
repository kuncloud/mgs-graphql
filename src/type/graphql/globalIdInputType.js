// @flow
const {GraphQLScalarType, GraphQLError, Kind} = require('graphql')
const {fromGlobalId} = require('graphql-relay')

function defGlobalIdInputType (typeName) {
  return new GraphQLScalarType({
    name: typeName + 'Id',
    description: 'Global id of ' + typeName,
    serialize (value) {
      throw new Error('Unsupported!!')
    },
    parseValue (value) {
      if (typeof value === 'string') {
        const { type, id } = fromGlobalId(value)
        if (type === typeName) {
          return id
        }
        throw new Error('Incorrect globalId type: ' + type)
      } else {
        throw new Error('Incorrect globalId format: ')
      }
    },
    parseLiteral (ast) {
      if (ast.kind !== Kind.STRING) {
        throw new GraphQLError('Query error: Can only parse string to GrobalId but got a: ' + ast.kind, [ast])
      }
      const value = ast.value
      if (typeof value === 'string') {
        const { type, id } = fromGlobalId(value)
        if (type === typeName) {
          return id
        }
        throw new Error('Incorrect globalId type: ' + type)
      } else {
        throw new Error('Incorrect globalId format: ' + value)
      }
    }
  })
}

const types = {}

module.exports = function globalIdInputType (typeName) {
  if (!types[typeName]) {
    types[typeName] = defGlobalIdInputType(typeName)
  }
  return types[typeName]
}
