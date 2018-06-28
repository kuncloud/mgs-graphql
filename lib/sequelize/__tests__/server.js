'use strict';

var startServer = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var app;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return _sequelize2.default.sync({
              force: true,
              logging: console.log
            });

          case 2:
            _context.next = 4;
            return (0, _data2.default)(_sequelize2.default);

          case 4:
            app = (0, _express2.default)();


            app.use('/graphql', (0, _expressGraphql2.default)({
              schema: _schema2.default,
              graphiql: true
            }));

            console.log('GraphQL Server is now running on http://localhost:4000');
            app.listen(4000);

          case 8:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function startServer() {
    return _ref.apply(this, arguments);
  };
}();

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _expressGraphql = require('express-graphql');

var _expressGraphql2 = _interopRequireDefault(_expressGraphql);

var _schema = require('./schema');

var _schema2 = _interopRequireDefault(_schema);

var _sequelize = require('./sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

var _data = require('./data');

var _data2 = _interopRequireDefault(_data);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

startServer().then(function () {
  return null;
}, function (err) {
  return console.log('Init GraphQL Server Fail', err);
});