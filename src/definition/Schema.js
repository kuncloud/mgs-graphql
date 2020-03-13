// @flow
const _ = require('lodash')

module.exports = class Schema {
  name

  config

  // remoteLinkConfig:RemoteLinkConfig

  constructor (name, options = {}) {
    this.name = name
    this.config = {
      fields: {},
      links: {},
      associations: {
        hasOne: {},
        belongsTo: {},
        hasMany: {},
        belongsToMany: {}
      },
      options: options,
      queries: {},
      mutations: {},
      subscriptions: {},
      methods: {},
      statics: {},
      description: ''
    }
    // this.remoteLinkConfig = {}
  }

  /**
   * Add the model base fields, and each field has a corresponding database column.
   * In default, each field generate a GraphQL field, unless it config with "hidden:true".
   */
  fields (fields) {
    this.config.fields = Object.assign(this.config.fields, fields)
    return this
  }

  /**
   * Add the model link fields, and each link generate a GraphQL field but no corresponding database column.
   */
  links (links) {
    _.forOwn(links, (value, key) => {
      value.isLinkField = true
    })
    this.config.links = Object.assign(this.config.links, links)

    return this
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
   * Add the GraphQL subscription methods.
   */
  subscriptions (subscriptions) {
    // TODO duplicate check
    this.config.subscriptions = Object.assign(this.config.subscriptions, subscriptions)
    return this
  }

  /**
   * Add instance method to current Schema.
   */
  methods (methods) {
    this.config.methods = Object.assign(this.config.methods, methods)
    return this
  }

  /**
   * Add statics method to current Schema.
   */
  statics (statics) {
    this.config.statics = Object.assign(this.config.statics, statics)
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#hasone|HasOne} relations to current Schema.
   */
  hasOne (config) {
    _.forOwn(config, (value, key) => {
      this.config.associations.hasOne[key] = value
    })
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#belongsto|BelongsTo} relations to current Schema.
   */
  belongsTo (config) {
    _.forOwn(config, (value, key) => {
      this.config.associations.belongsTo[key] = value
    })
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#one-to-many-associations|HasMany} relations to current Schema.
   */
  hasMany (config) {
    _.forOwn(config, (value, key) => {
      this.config.associations.hasMany[key] = value
    })
    return this
  }

  /**
   * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#belongs-to-many-associations|BelongsToMany} relations to current Schema.
   */
  belongsToMany (config) {
    _.forOwn(config, (value, key) => {
      this.config.associations.belongsToMany[key] = value
    })
    return this
  }

  plugin (plugin, options) {
    plugin(this, options)
  }
}
