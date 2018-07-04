'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (sequelize) {
  function listSchemas(dir) {
    var schemas = [];
    var handleFile = function handleFile(d) {
      return _fs2.default.readdirSync(_path2.default.resolve(__dirname, d)).map(function (file) {
        var stats = _fs2.default.statSync(_path2.default.resolve(__dirname, dir, file));
        var relativePath = [dir, file].join('/');
        if (file === '__tests__') {
          // ignore test folder
        } else if (stats.isDirectory()) {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = listSchemas(relativePath)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var schema = _step.value;

              schemas.push(schema);
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        } else if (stats.isFile()) {
          if (file.match(/\.js$/) !== null && file !== 'index.js') {
            var name = './' + relativePath.replace('.js', '');
            var schemaOrFun = require(name).default;
            if (schemaOrFun instanceof _2.default.Schema) {
              schemas.push(schemaOrFun);
            } else if (typeof schemaOrFun === 'function') {
              var _schema = schemaOrFun(sequelize);
              if (_schema instanceof _2.default.Schema) {
                schemas.push(_schema);
              } else {
                // console.log('Incorrect schema definition file: ' + name)
              }
            }
          }
        }
      });
    };
    handleFile(dir);
    return schemas;
  }

  var schemas = listSchemas('definition/schema');

  return _2.default.build({
    sequelize: sequelize,
    schemas: schemas,
    services: [_DemoService2.default],
    options: {
      hooks: [{
        description: 'Enable transaction on mutations',
        filter: function filter(_ref) {
          var type = _ref.type,
              config = _ref.config;
          return type === 'mutation';
        },
        hook: function () {
          var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(_ref3, _ref4, next) {
            var type = _ref3.type,
                config = _ref3.config;
            var source = _ref4.source,
                args = _ref4.args,
                context = _ref4.context,
                info = _ref4.info,
                schemas = _ref4.schemas;
            return regeneratorRuntime.wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    return _context.abrupt('return', sequelize.transaction(function (t) {
                      return next();
                    }));

                  case 1:
                  case 'end':
                    return _context.stop();
                }
              }
            }, _callee, this);
          }));

          function hook(_x, _x2, _x3) {
            return _ref2.apply(this, arguments);
          }

          return hook;
        }()
      }, {
        description: '自定义hook',
        filter: function filter(_ref5) {
          var type = _ref5.type,
              config = _ref5.config;
          return type === 'mutation' && config.config && config.config.hook;
        },
        hook: function () {
          var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(action, invokeInfo, next) {
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    return _context2.abrupt('return', action.config.config.hook(action, invokeInfo, next));

                  case 1:
                  case 'end':
                    return _context2.stop();
                }
              }
            }, _callee2, this);
          }));

          function hook(_x4, _x5, _x6) {
            return _ref6.apply(this, arguments);
          }

          return hook;
        }()
      }],
      mutation: {
        payloadFields: ['viewer']
      }
    }
  });
};

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _ = require('../../');

var _2 = _interopRequireDefault(_);

var _DemoService = require('./definition/service/DemoService');

var _DemoService2 = _interopRequireDefault(_DemoService);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }