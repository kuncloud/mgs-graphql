// @flow
const Sequelize = require('sequelize')

const sequelize = new Sequelize('testmsg', 'root', 'rootoop', {
  host: 'localhost',
  dialect: 'mysql',
  port: 3306,
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  logging: false
})

module.exports = sequelize
