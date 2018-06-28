'use strict';

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _GraphQLExecutor = require('../../__tests__/GraphQLExecutor');

var _GraphQLExecutor2 = _interopRequireDefault(_GraphQLExecutor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
/* eslint-env jest */


var graphQL = new _GraphQLExecutor2.default();

test('AddMutationPlugin should work.', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
  var result, userEdge, user, qResult, qUser;
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return graphQL.exec('\n  mutation{\n    addUser(input:{\n      clientMutationId:"XX",\n      userName:"Demo",\n      password:"password",\n    }){\n      addedUserEdge{\n        cursor\n        node{\n          id\n          userName\n          password\n          blocked\n          registerAt\n          createdAt\n          updatedAt\n          dueTodos {\n            count\n            edges {\n              node {\n                id\n              }\n            }\n          }\n          profile {\n            id\n          }\n        }\n      }\n    }\n  }\n  ');

        case 2:
          result = _context.sent;

          expect(result.errors).toBeUndefined();
          userEdge = _lodash2.default.get(result.data, 'addUser.addedUserEdge');

          expect(userEdge).toBeDefined();
          expect(userEdge.cursor).toBeDefined();

          user = userEdge.node;

          expect(user.id).toBeDefined();
          expect(user.userName).toEqual('Demo');
          expect(user.password).toEqual('password');
          expect(user.blocked).toEqual(false);
          expect(user.registerAt).toBeDefined();
          expect(user.createdAt).toBeDefined();
          expect(user.updatedAt).toBeDefined();
          expect(user.dueTodos).toBeDefined();
          expect(user.dueTodos.count).toEqual(0);
          expect(user.dueTodos.edges).toEqual([]);
          expect(user.profile).toBeNull();

          _context.next = 21;
          return graphQL.exec('\n  query{\n    user(id: "' + user.id + '") {\n      id\n      userName\n      password\n      blocked\n      registerAt\n      createdAt\n      updatedAt\n      dueTodos {\n        count\n        edges {\n          cursor\n          node {\n            id\n          }\n        }\n      }\n      profile {\n        id\n      }\n    }\n  }\n  ');

        case 21:
          qResult = _context.sent;

          expect(qResult.errors).toBeUndefined();
          qUser = _lodash2.default.get(qResult, 'data.user');

          expect(qUser).toEqual(user);

        case 25:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, undefined);
})));