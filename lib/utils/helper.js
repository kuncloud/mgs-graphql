'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var validateType = exports.validateType = function validateType(value) {
  var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'string';

  if (typeof type === 'string') return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === type || value && _typeof(value.$type) === type;
  return value instanceof type || value && value.$type instanceof type;
};