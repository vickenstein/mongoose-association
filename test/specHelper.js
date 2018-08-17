const mongoose = require('mongoose')
mongoose.requestCount = 0
mongoose.set('debug', function (collection, method, query, doc, options) {
  // console.log(collection, method, query)
  mongoose.requestCount++
})

const { mongooseAssociation } = require('../dist/index')
mongooseAssociation(mongoose)

const connect = require('./helpers/connect')
const disconnect = require('./helpers/disconnect')
const setupSchema = require('./helpers/setupSchema')

before(() => {
  return new Promise((resolve) => {
    connect(resolve)
  })
})

before(setupSchema)

after(() => {
  return new Promise((resolve) => {
    disconnect(resolve)
  })
})
