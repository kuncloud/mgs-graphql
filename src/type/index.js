// @flow
const Sequelize = require('sequelize')
const {GraphQLID, GraphQLString, GraphQLFloat, GraphQLInt, GraphQLBoolean} = require('graphql')

const GraphQLScalarTypes = require('./graphql')
const ScalarFieldType = require('./ScalarFieldType')

module.exports = {
  GraphQLScalarTypes: GraphQLScalarTypes,
  ScalarFieldType: ScalarFieldType,

  ScalarFieldTypes: ({
    Id: new ScalarFieldType({
      name: 'Id',
      graphQLInputType: GraphQLID,
      graphQLOutputType: GraphQLID,
      columnType: Sequelize.INTEGER
    }),
    String: new ScalarFieldType({
      name: 'String',
      graphQLInputType: GraphQLString,
      graphQLOutputType: GraphQLString,
      columnType: Sequelize.STRING
    }),
    Float: new ScalarFieldType({
      name: 'Float',
      graphQLInputType: GraphQLFloat,
      graphQLOutputType: GraphQLFloat,
      columnType: Sequelize.DOUBLE
    }),
    Int: new ScalarFieldType({
      name: 'Int',
      graphQLInputType: GraphQLInt,
      graphQLOutputType: GraphQLInt,
      columnType: Sequelize.INTEGER
    }),
    Boolean: new ScalarFieldType({
      name: 'Boolean',
      graphQLInputType: GraphQLBoolean,
      graphQLOutputType: GraphQLBoolean,
      columnType: Sequelize.BOOLEAN
    }),
    Date: new ScalarFieldType({
      name: 'Date',
      graphQLInputType: GraphQLScalarTypes.Date,
      graphQLOutputType: GraphQLScalarTypes.Date,
      columnType: Sequelize.DATE
    }),
    JSON: new ScalarFieldType({
      name: 'JSON',
      graphQLInputType: GraphQLScalarTypes.Json,
      graphQLOutputType: GraphQLScalarTypes.Json,
      columnType: Sequelize.JSON
    })
  })
}
