// @flow
/* eslint-env jest */
require('./schema')
const sequelize = require('./sequelize')
const initData = require('./data')

beforeAll(async () => {
  await sequelize.sync({
    force: true
  })
  await initData(sequelize)
})

afterAll(() => {
})
