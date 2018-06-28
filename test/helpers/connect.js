const mongoose = require('mongoose')

const host = process.env.MONGO_HOST || 'localhost'
const dbName = process.env.MONGO_DBNAME || 'test'

module.exports = (callback) => {
  mongoose.connect(`mongodb://${host}/${dbName}`, (error) => {
    if (error) throw error
    callback()
  })
}
