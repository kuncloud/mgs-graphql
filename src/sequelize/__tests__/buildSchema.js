// @flow
const path = require('path')
const fs = require('fs')
const GS = require('../../')
const DemoService = require('./definition/service/DemoService')

module.exports = function (sequelize) {
  function listSchemas (dir) {
    const schemas = []
    const handleFile = (d) => fs.readdirSync(path.resolve(__dirname, d)).map(function (file) {
      const stats = fs.statSync(path.resolve(__dirname, dir, file))
      const relativePath = [dir, file].join('/')
      if (file === '__tests__') {
        // ignore test folder
      } else if (stats.isDirectory()) {
        for (let schema of listSchemas(relativePath)) {
          schemas.push(schema)
        }
      } else if (stats.isFile()) {
        if (file.match(/\.js$/) !== null && file !== 'index.js') {
          const name = './' + relativePath.replace('.js', '')
          const schemaOrFun = require(name)
          if (schemaOrFun instanceof GS.Schema) {
            schemas.push(schemaOrFun)
          } else if ((typeof schemaOrFun) === 'function') {
            const schema = schemaOrFun(sequelize)
            if (schema instanceof GS.Schema) {
              schemas.push(schema)
            } else {
              // console.log('Incorrect schema definition file: ' + name)
            }
          }
        }
      }
    })
    handleFile(dir)
    return schemas
  }

  // const snapshot = v8Profile.takeSnapshot()
  const schemas = listSchemas('definition/schema')
  // snapshot.export((err, rlt) => {
  //   if (err) {
  //     return
  //   }
  //   fs.writeFileSync('./server_js.heapsnapshot', rlt)
  //   snapshot.delete()
  // })

  return GS.build({
    sequelize: sequelize,
    schemas: schemas,
    services: [DemoService],
    options: {
      hooks: [{
        description: 'Enable transaction on mutations',
        filter: ({type, config}) => type === 'mutation',
        hook: async function ({type, config}, {source, args, context, info, schemas}, next) {
          return sequelize.transaction(function (t) {
            return next()
          })
        }
      }, {
        description: '自定义hook',
        filter: ({type, config}) => type === 'mutation' && config.config && config.config.hook,
        hook: async function (action, invokeInfo, next) {
          return action.config.config.hook(action, invokeInfo, next)
        }
      }],
      mutation: {
        payloadFields: ['viewer']
      }
    }
  }
  )
}
