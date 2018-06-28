"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sequelize = require("sequelize");

var _sequelize2 = _interopRequireDefault(_sequelize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(dbModel, args) {
    var after, _args$first, first, before, last, _args$include, include, _args$condition, condition, _args$sort, sort, reverse, count, offset, result, index, startCursor, endCursor;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            after = args.after, _args$first = args.first, first = _args$first === undefined ? 100 : _args$first, before = args.before, last = args.last, _args$include = args.include, include = _args$include === undefined ? [] : _args$include, _args$condition = args.condition, condition = _args$condition === undefined ? {} : _args$condition, _args$sort = args.sort, sort = _args$sort === undefined ? [{
              field: 'id',
              order: 'ASC'
            }] : _args$sort;
            reverse = false;
            _context.next = 4;
            return dbModel.count({
              include: include,
              where: condition
            });

          case 4:
            count = _context.sent;


            if (last || before) {
              reverse = true;
              first = last || 100;
              before = before || count + 1;
              after = count - (parseInt(before) - 1);
              sort = sort.map(function (s) {
                return {
                  field: s.field,
                  order: s.order === 'ASC' ? 'DESC' : 'ASC'
                };
              });
            }
            offset = Math.max(after != null ? parseInt(after) : 0, 0);
            _context.next = 9;
            return dbModel.findAll({
              include: include,
              where: condition,
              order: sort.map(function (s) {
                return [s.field, s.order];
              }),
              limit: first,
              offset: offset
            });

          case 9:
            result = _context.sent;
            index = 0;
            startCursor = offset + 1;
            endCursor = offset + result.length;

            if (reverse) {
              startCursor = count - startCursor + 1;
              endCursor = count - endCursor + 1;
            }
            return _context.abrupt("return", {
              pageInfo: {
                startCursor: startCursor,
                endCursor: endCursor,
                hasPreviousPage: offset > 0,
                hasNextPage: offset + result.length < count
              },
              edges: reverse ? result.map(function (node) {
                return {
                  node: node,
                  cursor: count - (offset + index++)
                };
              }).reverse() : result.map(function (node) {
                return {
                  node: node,
                  cursor: offset + ++index
                };
              }),
              count: count
            });

          case 15:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  function resolveConnection(_x, _x2) {
    return _ref.apply(this, arguments);
  }

  return resolveConnection;
}();