const mongoose = require('mongoose')
mongoose.requestCount = 0
mongoose.set('debug', function (coll, method, query, doc, options) {
  mongoose.requestCount++
})

const MongooseAssociation = require('index')(mongoose)
mongoose.plugin(MongooseAssociation)

const connect = require('test/helpers/connect')
const drop = require('test/helpers/drop')
const disconnect = require('test/helpers/disconnect')

before(() => {
  return new Promise((resolve) => {
    connect(resolve)
  })
})

beforeEach(() => {
  return new Promise((resolve) => {
    drop(resolve)
  })
})

after(() => {
  return new Promise((resolve) => {
    disconnect(resolve)
  })
})
