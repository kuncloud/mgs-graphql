// @flow

module.exports = class ScalarFieldType {
  name
  description

  graphQLInputType

  graphQLOutputType

  columnType

  constructor (config) {
    this.name = config.name
    this.description = config.description
    this.graphQLInputType = config.graphQLInputType
    this.graphQLOutputType = config.graphQLOutputType
    this.columnType = config.columnType
  }
}
