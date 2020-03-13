const path = require('path')
const fs = require('fs')

const iterateFile = function (dir, filter) {
  const result = []
  fs.readdirSync(path.resolve(dir)).map(function (file) {
    const stats = fs.statSync(path.resolve(dir, file))
    const relativePath = [dir, file].join('/')
    if (stats.isDirectory()) {
      if (filter(dir, file, true)) {
        iterateFile(relativePath, filter).forEach(d => result.push(d))
      }
    } else if (stats.isFile()) {
      if (filter(dir, file, false)) {
        result.push({path: dir, fileName: file})
      }
    }
  })
  return result
}

module.exports = iterateFile
