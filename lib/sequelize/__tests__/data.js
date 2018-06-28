'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sequelize = require('sequelize');

var _sequelize2 = _interopRequireDefault(_sequelize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(sequelize) {
    var User, Todo, UserProfile, index, index2;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            User = sequelize.models['User'];
            Todo = sequelize.models['Todo'];
            UserProfile = sequelize.models['UserProfile'];
            index = 1;

          case 4:
            if (!(index < 100)) {
              _context.next = 21;
              break;
            }

            _context.next = 7;
            return User.create({
              id: index,
              userName: 'Demo' + index,
              password: 'Password' + index,
              blocked: index % 10 === 0,
              registerAt: new Date()
            });

          case 7:
            if (!(index % 2 === 0)) {
              _context.next = 10;
              break;
            }

            _context.next = 10;
            return UserProfile.create({
              ownerId: index,
              realName: 'Demo' + index + '.Real',
              age: index,
              gender: index % 2 === 0 ? 'Male' : 'Female'
            });

          case 10:
            if (!(index % 10 === 0)) {
              _context.next = 18;
              break;
            }

            index2 = 0;

          case 12:
            if (!(index2 < 30)) {
              _context.next = 18;
              break;
            }

            _context.next = 15;
            return Todo.create({
              ownerId: index,
              title: 'Task-' + index + '-' + index2,
              description: 'Task Desc ' + index + '-' + index2,
              completed: index2 % 3 === 0,
              dueAt: index2 % 3 === 0 ? new Date() : new Date(Date.now() + 10000000)
            });

          case 15:
            index2++;
            _context.next = 12;
            break;

          case 18:
            index++;
            _context.next = 4;
            break;

          case 21:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();