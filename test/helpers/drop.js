const connect = require('./connect')
const mongoose = require('mongoose')

module.exports = (callback) => {
  mongoose.connection.db.dropDatabase((error) => {
    if (error) throw error
    callback()
  })
}
