'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Service = function () {
  function Service(name) {
    _classCallCheck(this, Service);

    this.name = name;
    this.config = {
      queries: {},
      mutations: {},
      statics: {}
    };
  }

  /**
   * Add the GraphQL query methods.
   */


  _createClass(Service, [{
    key: 'queries',
    value: function (_queries) {
      function queries(_x) {
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
      function mutations(_x2) {
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
     * Add statics method to current Service.
     */

  }, {
    key: 'statics',
    value: function (_statics) {
      function statics(_x3) {
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
  }]);

  return Service;
}();

exports.default = Service;