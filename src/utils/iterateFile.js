import path from 'path'
import fs from 'fs'

const iterateFile = function (dir:string, filter:(path:string, fileName:string, isDirectory:boolean) => boolean):Array<{path:string, fileName:string}> {
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

export default iterateFile
