const mongoose = require('mongoose')

const host = process.env.MONGO_HOST || 'localhost'
const dbName = process.env.MONGO_DBNAME || 'test'

mongoose.set('debug', function (collection, method, query, doc, options) {
  // console.log(collection, method, require('util').inspect(query, { depth: 20 }))
  // mongoose.requestCount++
})

module.exports = (callback) => {
  mongoose.connect(`mongodb://${host}/${dbName}`, (error) => {
    if (error) throw error
    callback()
  })
}
