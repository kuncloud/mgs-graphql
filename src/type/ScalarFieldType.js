// @flow

module.exports = class ScalarFieldType {

  constructor (config) {
    this.name = config.name
    this.description = config.description
    this.graphQLInputType = config.graphQLInputType
    this.graphQLOutputType = config.graphQLOutputType
    this.columnType = config.columnType
  }
}
