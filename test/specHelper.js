const mongoose = require('mongoose')
mongoose.requestCount = 0
mongoose.set('debug', function (collection, method, query, doc, options) {
  // console.log(collection, method, query)
  mongoose.requestCount++
})

require('index')(mongoose)

const connect = require('test/helpers/connect')
const drop = require('test/helpers/drop')
const disconnect = require('test/helpers/disconnect')
const setupSchema = require('test/helpers/setupSchema')

before(() => {
  return new Promise((resolve) => {
    connect(resolve)
  })
})

before(() => {
  return new Promise((resolve) => {
    drop(resolve)
  })
})

before(setupSchema)

after(() => {
  return new Promise((resolve) => {
    disconnect(resolve)
  })
})
