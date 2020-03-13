// @flow
// const express = require('express')
// const fastify = require('fastify')
// const graphqlHTTP = require('express-graphql')
//
const schema = require('./schema')
// const sequelize = require('./sequelize')
// const initData = require('./data')

// async function startServer () {
//   await sequelize.sync({
//     force: false,
//     logging: console.log
//   })
//   // await initData(sequelize)
//
//   const app = express()
//
//   app.use('/graphql', graphqlHTTP({
//     schema,
//     graphiql: true
//   }))
//
//   // console.log('GraphQL Server is now running on http://localhost:4000')
//   app.listen(4000)
// }
//
// (async () => {
//   try {
//     await startServer()
//   } catch (e) {
//     throw e
//   }
// })()
//
// // startServer().then(() => null, (err) => console.log('Init GraphQL Server Fail', err))
//
// process.on('uncaughtException', (err) => {
//   throw err
// })
