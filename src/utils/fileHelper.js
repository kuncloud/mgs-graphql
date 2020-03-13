/**
 * Created by yuyanq on 2018/8/6.
 */
const fs = require('fs')

function exists (thePath) {
  try {
    const state = fs.statSync(thePath)
    return state.isFile()
  } catch (e) {
    throw new Error(`no such file or directory, stat ${thePath}`)
  }
}

exports.isFile = function isFile (filePath) {
  return exists(filePath)
}
