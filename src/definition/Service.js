// @flow

module.exports = class Service {

  constructor (name) {
    this.name = name
    this.config = {
      queries: {},
      mutations: {},
      statics: {}
    }
  }

  /**
   * Add the GraphQL query methods.
   */
  queries (queries) {
    // TODO duplicate check
    this.config.queries = Object.assign(this.config.queries, queries)
    return this
  }

  /**
   * Add the GraphQL mutataion methods.
   */
  mutations (mutations) {
    // TODO duplicate check
    this.config.mutations = Object.assign(this.config.mutations, mutations)
    return this
  }

  /**
   * Add statics method to current Service.
   */
  statics (statics) {
    this.config.statics = Object.assign(this.config.statics, statics)
    return this
  }
}
