const connect = require('./connect')
const drop = require('./drop')
const mongoose = require('mongoose')
require('dist/index')(mongoose)

module.exports = async () => {
  connect((error) => {
    if (error) throw error
    drop((error) => {
      if (error) throw error
      require('./setupSchema')
      return true
    })
  })
}
