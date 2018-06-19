// @flow
import Sequelize from 'sequelize'
import cls from 'continuation-local-storage'

import path from 'path'
import fs from 'fs'
import GS from '../../../src'

import {dbCfg} from '../config'

const namespace = cls.createNamespace('my-db-namespace')
// Sequelize.cls = namespace
Sequelize.useCLS(namespace)

export const sequelize = new Sequelize(dbCfg.schema, dbCfg.user, dbCfg.password, dbCfg.options)
sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

function listModels (dir:string):Array<GS.Schema> {
  const models:Array<GS.Schema> = []
  const handleFile = (d) => fs.readdirSync(path.resolve(__dirname, d)).map(function (file) {
    const stats = fs.statSync(path.resolve(__dirname, dir, file))
    const relativePath = [dir, file].join('/')
    if (stats.isDirectory()) {
      return handleFile(relativePath)
    } else if (stats.isFile()) {
      if (file.match(/\.js$/) !== null && file !== 'index.js') {
        const name = './' + relativePath.replace('.js', '')
        const model = require(name).default
        if (model instanceof GS.Schema) {
          models.push(model)
        }
      }
    }
  })
  handleFile(dir)
  return models
}

const models = listModels('models')

const schema = GS.build({sequelize:sequelize, schemas:models,options:{
  hooks: [{
    description: 'Enable transaction on mutations',
    filter: ({type, config}) => type === 'mutation',
    hook: async function ({type, config}, {source, args, context, info, models}, next) {
      return sequelize.transaction(function (t) {
        return next()
      })
    }
  }, {
    description: 'ACL hook example',
    filter: ({type, config}) => type === 'query' || type === 'mutation',
    hook: async function ({type, config}, {source, args, context, info, models}, next) {
      if (config.config && config.config.acl) {
        console.log("ACL config for " + config.name + ":" + config.config.acl)
      }
      return next()
    }
  }],
  mutation: {
    payloadFields: ['viewer']
  }
}}).graphQLSchema

sequelize.sync({
  force: true,
  logging: console.log
}).then(() => console.log('Init DB Done'), (err) => console.log('Init DB Fail', err))

sequelize.showAllSchemas()
export default schema
