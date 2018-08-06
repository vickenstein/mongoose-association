const mongoose = require('mongoose')
mongoose.requestCount = 0
mongoose.set('debug', function (collection, method, query, doc, options) {
  // console.log(collection, method, query)
  mongoose.requestCount++
})

const { mongooseAssociation } = require('dist/index')
console.log(mongooseAssociation, "WTF")
mongooseAssociation(mongoose)

const connect = require('test/helpers/connect')
const disconnect = require('test/helpers/disconnect')
const setupSchema = require('test/helpers/setupSchema')

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
