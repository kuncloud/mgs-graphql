'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isFile = isFile;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by yuyanq on 2018/8/6.
 */
function exists(thePath) {
  return _fs2.default.existsSync(thePath) || _fs2.default.existsSync(thePath);
}

function isFile(filePath) {
  return exists(filePath) && _fs2.default.statSync(filePath).isFile();
}