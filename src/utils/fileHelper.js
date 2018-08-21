/**
 * Created by yuyanq on 2018/8/6.
 */
import fs from 'fs'

function exists (thePath) {
  return fs.existsSync(thePath) ||
    fs.existsSync(thePath)
}

export function isFile (filePath) {
  return exists(filePath) && fs.statSync(filePath).isFile()
}
