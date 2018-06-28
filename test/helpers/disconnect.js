const mongoose = require('mongoose')

module.exports = (callback) => {
  mongoose.connection.close((error) => {
    if (error) throw error
    callback()
  })
}
