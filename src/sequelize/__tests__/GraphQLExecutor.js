// @flow
const {graphql} = require('graphql')
const schema = require('./schema')
module.exports = class GraphQLExec {
  rootValue
  context

  constructor (context:Object = {}) {
    this.rootValue = {}
    this.context = context
  }

  async exec (query, variables = {}) {
    return graphql(schema, query, this.rootValue, this.context, variables)
  }
}
