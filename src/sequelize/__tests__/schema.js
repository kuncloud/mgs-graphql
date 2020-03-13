// @flow
const buildSchema = require('./buildSchema')
const sequelize = require('./sequelize')

module.exports = buildSchema(sequelize).graphQLSchema
