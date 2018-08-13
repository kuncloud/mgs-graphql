'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ = require('../../../../');

var _2 = _interopRequireDefault(_);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var UserType = 'User';
var TodoType = 'Todo';

exports.default = _2.default.schema('Todo').fields({
  owner: {
    $type: UserType,
    required: true
  },
  title: {
    $type: String,
    required: true
  },
  description: String,
  completed: {
    $type: Boolean,
    required: true
  },
  dueAt: Date
}).queries({
  dueTodos: {
    description: 'Find all due todos',
    $type: [TodoType],
    config: {
      acl: 'User'
    },
    args: {
      ownerId: {
        $type: UserType,
        required: true
      },
      dueBefore: {
        $type: Date,
        required: true
      }
    },
    resolve: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(_ref2, context, info, _ref3) {
        var ownerId = _ref2.ownerId,
            dueBefore = _ref2.dueBefore;
        var Todo = _ref3.models.Todo;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt('return', Todo.find({
                  where: {
                    completed: false,
                    ownerId: ownerId,
                    dueAt: {
                      $lt: dueBefore
                    }
                  }
                }));

              case 1:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function resolve(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
      }

      return resolve;
    }()
  }
}).mutations({
  completedTodo: {
    description: 'Mark the todo task completed.',
    inputFields: {
      todoId: {
        $type: TodoType,
        required: true
      }
    },
    outputFields: {
      changedTodo: TodoType
    },
    mutateAndGetPayload: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(_ref5, context, info, _ref6) {
        var todoId = _ref5.todoId;
        var Todo = _ref6.models.Todo;
        var todo;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return Todo.findOne({ where: { id: todoId } });

              case 2:
                todo = _context2.sent;

                if (todo) {
                  _context2.next = 5;
                  break;
                }

                throw new Error('Todo entity not found.');

              case 5:
                if (todo.completed) {
                  _context2.next = 9;
                  break;
                }

                todo.completed = true;
                _context2.next = 9;
                return todo.save();

              case 9:
                return _context2.abrupt('return', { changedTodo: todo });

              case 10:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function mutateAndGetPayload(_x5, _x6, _x7, _x8) {
        return _ref4.apply(this, arguments);
      }

      return mutateAndGetPayload;
    }()
  }
});