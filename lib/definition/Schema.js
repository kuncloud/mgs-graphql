'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Schema = function () {
  function Schema(name) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Schema);

    this.name = name;
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
      methods: {},
      statics: {}
    };
    this.remoteLinkConfig = {};
  }

  /**
   * Add the model base fields, and each field has a corresponding database column.
   * In default, each field generate a GraphQL field, unless it config with "hidden:true".
   */


  _createClass(Schema, [{
    key: 'fields',
    value: function (_fields) {
      function fields(_x) {
        return _fields.apply(this, arguments);
      }

      fields.toString = function () {
        return _fields.toString();
      };

      return fields;
    }(function (fields) {
      this.config.fields = Object.assign(this.config.fields, fields);
      return this;
    })
  }, {
    key: 'remoteLinks',
    value: function remoteLinks(config) {
      this.remoteLinkConfig = Object.assign(this.remoteLinkConfig, config);
      return this;
    }

    /**
     * Add the model link fields, and each link generate a GraphQL field but no corresponding database column.
     */

  }, {
    key: 'links',
    value: function (_links) {
      function links(_x2) {
        return _links.apply(this, arguments);
      }

      links.toString = function () {
        return _links.toString();
      };

      return links;
    }(function (links) {
      _lodash2.default.forOwn(links, function (value, key) {
        value.isLinkField = true;
      });
      this.config.links = Object.assign(this.config.links, links);

      return this;
    })

    /**
     * Add the GraphQL query methods.
     */

  }, {
    key: 'queries',
    value: function (_queries) {
      function queries(_x3) {
        return _queries.apply(this, arguments);
      }

      queries.toString = function () {
        return _queries.toString();
      };

      return queries;
    }(function (queries) {
      // TODO duplicate check
      this.config.queries = Object.assign(this.config.queries, queries);
      return this;
    })

    /**
     * Add the GraphQL mutataion methods.
     */

  }, {
    key: 'mutations',
    value: function (_mutations) {
      function mutations(_x4) {
        return _mutations.apply(this, arguments);
      }

      mutations.toString = function () {
        return _mutations.toString();
      };

      return mutations;
    }(function (mutations) {
      // TODO duplicate check
      this.config.mutations = Object.assign(this.config.mutations, mutations);
      return this;
    })

    /**
     * Add instance method to current Schema.
     */

  }, {
    key: 'methods',
    value: function (_methods) {
      function methods(_x5) {
        return _methods.apply(this, arguments);
      }

      methods.toString = function () {
        return _methods.toString();
      };

      return methods;
    }(function (methods) {
      this.config.methods = Object.assign(this.config.methods, methods);
      return this;
    })

    /**
     * Add statics method to current Schema.
     */

  }, {
    key: 'statics',
    value: function (_statics) {
      function statics(_x6) {
        return _statics.apply(this, arguments);
      }

      statics.toString = function () {
        return _statics.toString();
      };

      return statics;
    }(function (statics) {
      this.config.statics = Object.assign(this.config.statics, statics);
      return this;
    })

    /**
     * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#hasone|HasOne} relations to current Schema.
     */

  }, {
    key: 'hasOne',
    value: function hasOne(config) {
      var _this = this;

      _lodash2.default.forOwn(config, function (value, key) {
        _this.config.associations.hasOne[key] = value;
      });
      return this;
    }

    /**
     * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#belongsto|BelongsTo} relations to current Schema.
     */

  }, {
    key: 'belongsTo',
    value: function belongsTo(config) {
      var _this2 = this;

      _lodash2.default.forOwn(config, function (value, key) {
        _this2.config.associations.belongsTo[key] = value;
      });
      return this;
    }

    /**
     * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#one-to-many-associations|HasMany} relations to current Schema.
     */

  }, {
    key: 'hasMany',
    value: function hasMany(config) {
      var _this3 = this;

      _lodash2.default.forOwn(config, function (value, key) {
        _this3.config.associations.hasMany[key] = value;
      });
      return this;
    }

    /**
     * Add {@link http://docs.sequelizejs.com/en/latest/docs/associations/#belongs-to-many-associations|BelongsToMany} relations to current Schema.
     */

  }, {
    key: 'belongsToMany',
    value: function belongsToMany(config) {
      var _this4 = this;

      _lodash2.default.forOwn(config, function (value, key) {
        _this4.config.associations.belongsToMany[key] = value;
      });
      return this;
    }
  }, {
    key: 'plugin',
    value: function plugin(_plugin, options) {
      _plugin(this, options);
    }
  }]);

  return Schema;
}();

exports.default = Schema;