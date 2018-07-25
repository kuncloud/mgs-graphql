'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var resolve = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(Model, _ref2) {
    var _ref2$args = _ref2.args,
        args = _ref2$args === undefined ? {} : _ref2$args,
        _ref2$condition = _ref2.condition,
        condition = _ref2$condition === undefined ? {} : _ref2$condition,
        _ref2$include = _ref2.include,
        include = _ref2$include === undefined ? [] : _ref2$include,
        _ref2$sort = _ref2.sort,
        sort = _ref2$sort === undefined ? [] : _ref2$sort;
    var after, first, before, last, count, offset, order, result, index, startCursor, endCursor;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            after = args.after, first = args.first, before = args.before, last = args.last;

            first = first == null ? 100 : first;

            _context.next = 4;
            return Model.count({
              where: _extends({}, condition),
              include: include
            });

          case 4:
            count = _context.sent;

            if (!(last || before)) {
              _context.next = 7;
              break;
            }

            throw new Error('Argument last or before is not supported!');

          case 7:
            offset = Math.max(after != null ? parseInt(after) : 0, 0);


            sort = sort || args.sort || [];

            order = sort.map(function (_ref3) {
              var field = _ref3.field,
                  order = _ref3.order;
              return [field, order];
            });
            _context.next = 12;
            return Model.findAll({
              where: _extends({}, condition),
              include: include,
              limit: first,
              offset: offset,
              order: order
            });

          case 12:
            result = _context.sent;
            index = 0;
            startCursor = offset + 1;
            endCursor = offset + result.length;
            return _context.abrupt('return', {
              pageInfo: {
                startCursor: startCursor,
                endCursor: endCursor,
                hasPreviousPage: offset > 0,
                hasNextPage: offset + result.length < count
              },
              edges: result.map(function (node) {
                return {
                  node: node,
                  cursor: offset + ++index
                };
              }),
              count: count
            });

          case 17:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  function connectionResolve(_x, _x2) {
    return _ref.apply(this, arguments);
  }

  return connectionResolve;
}();

var sqlResolve = function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(sequelize, modelName, args) {
    var after, first, before, last, conditionSql, orderBySql, replacements, count, offset, tableName, columnMappings, result, index, startCursor, endCursor;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            after = args.after, first = args.first, before = args.before, last = args.last, conditionSql = args.conditionSql, orderBySql = args.orderBySql, replacements = args.replacements;


            first = first == null ? 100 : first;

            _context2.next = 4;
            return sequelize.query('select count(*) as count ' + conditionSql, { replacements: replacements });

          case 4:
            count = _context2.sent[0][0].count;

            if (!(last || before)) {
              _context2.next = 7;
              break;
            }

            throw new Error('Argument last or before is not supported!');

          case 7:
            offset = Math.max(after != null ? parseInt(after) : 0, 0);
            tableName = sequelize.models[modelName].options.tableName || sequelize.models[modelName].options.name.plural;
            columnMappings = [];

            _lodash2.default.forOwn(sequelize.models[modelName].tableAttributes, function (field, key) {
              if (field && field.field && field.fieldName) {
                if (field.field === field.fieldName) {
                  columnMappings.push(tableName + '.' + field.field);
                } else {
                  columnMappings.push(tableName + '.' + field.field + ' as ' + field.fieldName);
                }
              }
            });

            _context2.next = 13;
            return sequelize.query('select ' + columnMappings.join(', ') + ' ' + conditionSql + ' ' + orderBySql + ' LIMIT ' + first + ' OFFSET ' + offset, {
              replacements: replacements,
              model: sequelize.models[modelName],
              mapToModel: true
            });

          case 13:
            result = _context2.sent;
            index = 0;
            startCursor = offset + 1;
            endCursor = offset + result.length;
            return _context2.abrupt('return', {
              pageInfo: {
                startCursor: startCursor,
                endCursor: endCursor,
                hasPreviousPage: offset > 0,
                hasNextPage: offset + result.length < count
              },
              edges: result.map(function (node) {
                return {
                  node: node,
                  cursor: offset + ++index
                };
              }),
              count: count
            });

          case 18:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function sqlResolve(_x3, _x4, _x5) {
    return _ref4.apply(this, arguments);
  };
}();

module.exports = {
  resolve: resolve,
  sqlResolve: sqlResolve
};